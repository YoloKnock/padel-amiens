// ============================================
// API Route — Cron envoi d'alertes email tournois
// ============================================
// Déclenchée 1x/jour par Vercel Cron (configuré dans vercel.json,
// 30 min après le scraper pour avoir les nouveaux tournois en DB).
//
// Pour chaque user avec `enabled=true` :
//   1. Récupère ses préférences (catégories, genres, distance max)
//   2. Trouve les tournois CRÉÉS depuis son `last_sent_at` qui matchent
//   3. Si > 0 → envoie un email récap via Resend
//   4. Met à jour `last_sent_at` (qu'il y ait eu match ou non — sinon
//      on re-scanne les mêmes tournois à l'infini)
//
// Sécurité : Authorization: Bearer <CRON_SECRET> (idem scrape).

import { NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email';
import { distanceFromAmiens } from '@/lib/geo';
import { createAdminClient } from '@/lib/supabase';
import type { AlertPreferences } from '@/types/alert';

export const runtime = 'nodejs';
// Le cron peut être long si on a beaucoup d'users avec alertes : 1s par
// email Resend. Cap à 60s = ~60 users notifiés max par run (largement
// au-dessus de notre échelle actuelle).
export const maxDuration = 60;

interface TournamentForAlert {
  id: string;
  category: string;
  gender: string;
  title: string;
  start_date: string;
  end_date: string | null;
  club_name: string | null;
  club_city: string | null;
  club_lat: number | null;
  club_lng: number | null;
  registration_url: string | null;
  created_at: string;
}

/** Construit le corps texte de l'email pour un user, en listant ses tournois. */
function formatAlertEmail(
  pseudo: string,
  tournaments: (TournamentForAlert & { distance_km: number | null })[]
): { subject: string; text: string } {
  const count = tournaments.length;
  const subject =
    count === 1
      ? '1 nouveau tournoi padel près de chez toi'
      : `${count} nouveaux tournois padel près de chez toi`;

  const lines: string[] = [];
  lines.push(`Salut ${pseudo} !`);
  lines.push('');
  lines.push(
    count === 1
      ? 'Un nouveau tournoi qui matche tes critères vient d\'être publié :'
      : `${count} nouveaux tournois qui matchent tes critères viennent d\'être publiés :`
  );
  lines.push('');

  for (const t of tournaments) {
    const date = new Date(t.start_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    lines.push(`• ${t.category} ${t.gender} — ${t.title}`);
    lines.push(
      `  📅 ${date}` +
        (t.club_name ? ` · 🏟️ ${t.club_name}` : '') +
        (t.distance_km !== null ? ` · 📍 ${t.distance_km} km` : '')
    );
    lines.push(`  https://padel-amiens.fr/tournoi/${t.id}`);
    lines.push('');
  }

  lines.push('À bientôt sur les courts !');
  lines.push('');
  lines.push(
    'Tu peux modifier tes critères ou désactiver ces emails sur https://padel-amiens.fr/profil'
  );

  return { subject, text: lines.join('\n') };
}

export async function GET(request: Request) {
  // Auth cron : même secret que /api/cron/scrape-tournaments
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1) Récupère tous les users avec alertes activées + au moins 1 catégorie
  const { data: prefsList, error: prefsErr } = await supabase
    .from('user_alert_preferences')
    .select('*')
    .eq('enabled', true);

  if (prefsErr) {
    console.error('[cron alerts] prefs error:', prefsErr);
    return NextResponse.json({ error: 'DB error (prefs)' }, { status: 500 });
  }

  const eligible = (prefsList ?? []).filter(
    (p) => Array.isArray(p.categories) && p.categories.length > 0
  ) as AlertPreferences[];

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'aucun user éligible' });
  }

  // 2) On récupère TOUS les tournois à venir une seule fois pour faire
  //    matching en mémoire (moins de queries). Sur notre échelle (max
  //    quelques centaines de tournois à venir), c'est trivial en RAM.
  const { data: tournaments, error: tErr } = await supabase
    .from('tournaments')
    .select(
      'id, category, gender, title, start_date, end_date, club_id, registration_url, created_at, ' +
        'clubs!inner(name, city, latitude, longitude)'
    )
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(500);

  if (tErr) {
    console.error('[cron alerts] tournaments error:', tErr);
    return NextResponse.json({ error: 'DB error (tournaments)' }, { status: 500 });
  }

  // Aplatissement de la jointure clubs (Supabase renvoie un objet imbriqué)
  type RawRow = {
    id: string;
    category: string;
    gender: string;
    title: string;
    start_date: string;
    end_date: string | null;
    registration_url: string | null;
    created_at: string;
    clubs: { name: string | null; city: string | null; latitude: number | null; longitude: number | null } | null;
  };
  const allTournaments: TournamentForAlert[] = (tournaments ?? []).map(
    (raw) => {
      const r = raw as unknown as RawRow;
      return {
        id: r.id,
        category: r.category,
        gender: r.gender,
        title: r.title,
        start_date: r.start_date,
        end_date: r.end_date,
        registration_url: r.registration_url,
        created_at: r.created_at,
        club_name: r.clubs?.name ?? null,
        club_city: r.clubs?.city ?? null,
        club_lat: r.clubs?.latitude ?? null,
        club_lng: r.clubs?.longitude ?? null,
      };
    }
  );

  // 3) Pour chaque user : filtrer + envoyer
  let sentCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const prefs of eligible) {
    try {
      // Cutoff : on ne prend que les tournois ajoutés EN DB après le dernier
      // envoi. Premier passage (last_sent_at NULL) → on prend les 24h
      // précédentes pour éviter d'envoyer un récap massif rétroactif.
      const cutoff = prefs.last_sent_at
        ? new Date(prefs.last_sent_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const matching = allTournaments
        .filter((t) => new Date(t.created_at) > cutoff)
        .filter((t) => prefs.categories.includes(t.category))
        .filter(
          (t) => prefs.genders.length === 0 || prefs.genders.includes(t.gender)
        )
        .map((t) => ({
          ...t,
          distance_km: distanceFromAmiens(t.club_lat, t.club_lng),
        }))
        .filter((t) => {
          if (prefs.max_distance_km === 0) return true; // 0 = toutes distances
          if (t.distance_km === null) return false; // on exclut si on ne sait pas
          return t.distance_km <= prefs.max_distance_km;
        });

      // Update last_sent_at MÊME si pas de match (sinon on re-checke les mêmes
      // tournois indéfiniment et on risque le double-send à la moindre reprise).
      const newSentAt = new Date().toISOString();

      if (matching.length === 0) {
        await supabase
          .from('user_alert_preferences')
          .update({ last_sent_at: newSentAt })
          .eq('user_id', prefs.user_id);
        updatedCount++;
        continue;
      }

      // Récupère l'email + pseudo du user
      const [{ data: authUser }, { data: profile }] = await Promise.all([
        supabase.auth.admin.getUserById(prefs.user_id),
        supabase
          .from('profiles')
          .select('pseudo')
          .eq('id', prefs.user_id)
          .maybeSingle(),
      ]);

      const email = authUser.user?.email;
      if (!email) {
        errors.push(`User ${prefs.user_id} sans email`);
        continue;
      }
      const pseudo = profile?.pseudo ?? 'joueur';

      const { subject, text } = formatAlertEmail(pseudo, matching);
      const res = await sendEmail({ to: email, subject, text });

      if (!res.success) {
        errors.push(`User ${prefs.user_id} : ${res.info}`);
        // On ne met PAS à jour last_sent_at en cas d'échec : on retentera
        // au prochain cron avec les mêmes tournois.
        continue;
      }

      await supabase
        .from('user_alert_preferences')
        .update({ last_sent_at: newSentAt })
        .eq('user_id', prefs.user_id);

      sentCount++;
      updatedCount++;
    } catch (err) {
      errors.push(
        `User ${prefs.user_id} : ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    eligible_users: eligible.length,
    sent: sentCount,
    updated: updatedCount,
    errors,
  });
}
