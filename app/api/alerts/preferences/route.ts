// ============================================
// API Route — Préférences d'alerte tournois
// ============================================
// GET /api/alerts/preferences   → renvoie mes prefs (defaults si vide)
// PUT /api/alerts/preferences   → upsert mes prefs
//
// Une seule ligne par user_id (PK). On UPSERT pour la simplicité.

import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';
import {
  AlertPreferencesInputSchema,
  DEFAULT_ALERT_PREFERENCES,
  type AlertPreferences,
} from '@/types/alert';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_alert_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[alerts GET]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Si pas de ligne en DB, on renvoie les defaults (frontend l'affichera tel quel
  // et déclenchera un PUT au premier "Enregistrer")
  if (!data) {
    return NextResponse.json({
      preferences: {
        user_id: user.id,
        ...DEFAULT_ALERT_PREFERENCES,
        last_sent_at: null,
        updated_at: new Date().toISOString(),
      } as AlertPreferences,
    });
  }

  return NextResponse.json({ preferences: data as AlertPreferences });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AlertPreferencesInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('user_alert_preferences')
    .upsert({
      user_id: user.id,
      enabled: parsed.data.enabled,
      max_distance_km: parsed.data.max_distance_km,
      categories: parsed.data.categories,
      genders: parsed.data.genders,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[alerts PUT]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
