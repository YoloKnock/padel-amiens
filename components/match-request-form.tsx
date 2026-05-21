// ============================================
// Formulaire de création d'annonce matchmaking
// ============================================
// Client component. Poste vers /api/match-requests. Validation côté serveur
// via Zod.
//
// Refondu après audit UX :
//   - Date par défaut = samedi prochain (les gens raisonnent en weekends)
//   - Lieu = dropdown des clubs connus + option "Autre" (anti texte libre
//     qui polluait les filtres)
//   - Niveau recherché = chips cliquables qui pré-remplissent le champ
//     (alignement avec les filtres /matchs qui matchent par mots-clés)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/** Renvoie l'ISO date du samedi prochain (ou aujourd'hui si on est déjà
 *  samedi). Sert de date par défaut : la majorité des annonces sont
 *  postées pour des matchs de week-end. */
function getNextSaturdayIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0=dim, 6=sam
  const daysToSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
  const sat = new Date(now);
  sat.setDate(sat.getDate() + daysToSat);
  return `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(
    sat.getDate()
  ).padStart(2, '0')}`;
}

// Niveaux pré-définis pour les chips cliquables — alignés avec les
// mots-clés utilisés dans le tri intelligent de /matchs (match-list.tsx).
const LEVEL_PRESETS = [
  'Tous niveaux',
  'Débutant',
  'Intermédiaire / P25-P50',
  'Confirmé / P100+',
  'Expert / P250+',
];

interface ClubOption {
  id: string;
  name: string;
  city: string | null;
}

interface MatchRequestFormProps {
  /** Ville par défaut pré-remplie dans le champ "Lieu" (prise depuis le
   *  profil utilisateur pour éviter de retaper). Fallback si l'user
   *  choisit "Autre" sans rien taper. */
  defaultLocation?: string | null;
  /** Liste des clubs connus pour le dropdown du champ "Lieu" — passés
   *  depuis le server component qui les fetch depuis la DB. */
  clubs?: ClubOption[];
}

export function MatchRequestForm({
  defaultLocation,
  clubs = [],
}: MatchRequestFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  // Suivi du club sélectionné via dropdown. Une valeur spéciale "__custom"
  // signifie "Autre — je vais taper en texte libre".
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [customLocation, setCustomLocation] = useState(defaultLocation ?? '');
  // Niveau recherché : on stocke en state pour pouvoir cliquer sur un
  // preset qui pré-remplit le champ + permettre une saisie libre.
  const [levelWanted, setLevelWanted] = useState('');

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);

    // Calcule la valeur finale du champ "location" selon la sélection :
    //   - Un club connu sélectionné : on prend son nom (ex. "AAC Tennis Padel")
    //   - Autre / custom : on prend ce que l'user a tapé
    //   - Rien : null
    let finalLocation: string | null = null;
    if (selectedClubId && selectedClubId !== '__custom') {
      const club = clubs.find((c) => c.id === selectedClubId);
      finalLocation = club ? club.name : null;
    } else if (selectedClubId === '__custom') {
      finalLocation = customLocation.trim() || null;
    } else {
      // Cas par défaut (aucune sélection explicite) : on prend le hidden
      // input ou le défaut ville profil pour ne pas régresser sur les
      // users qui auraient pré-rempli leur ville dans le profil.
      finalLocation = customLocation.trim() || null;
    }

    const payload = {
      when_date: String(formData.get('when_date') ?? '').trim(),
      when_hour: (String(formData.get('when_hour') ?? '').trim() || null) as string | null,
      location: finalLocation,
      level_wanted: levelWanted.trim() || null,
      comment: (String(formData.get('comment') ?? '').trim() || null) as string | null,
    };

    try {
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.error ?? 'Création échouée');
        setSubmitting(false);
        return;
      }

      toast.success('Annonce publiée !');
      router.push('/matchs');
      router.refresh();
    } catch (error) {
      console.error('[match-request-form]', error);
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="when_date" className="block text-sm font-medium mb-1.5">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="when_date"
            name="when_date"
            type="date"
            required
            min={getTodayIso()}
            // Smart default : samedi prochain (vs aujourd'hui auparavant) —
            // c'est le créneau le plus courant pour les annonces de match.
            defaultValue={getNextSaturdayIso()}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Par défaut : samedi prochain
          </p>
        </div>

        <div>
          <label htmlFor="when_hour" className="block text-sm font-medium mb-1.5">
            Heure / créneau
          </label>
          <input
            id="when_hour"
            name="when_hour"
            type="text"
            maxLength={50}
            placeholder="18h, soirée, après le boulot..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* ============================================
          Lieu : dropdown clubs + option "Autre"
          ============================================
          Évite que les annonces aient des "AAC", "aac", "Aac amiens",
          "le grand centre" tous différents → impossible à filtrer. */}
      <div>
        <label htmlFor="club-select" className="block text-sm font-medium mb-1.5">
          Lieu / club
        </label>
        <select
          id="club-select"
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white"
        >
          <option value="">— Choisir un club —</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.city ? ` (${c.city})` : ''}
            </option>
          ))}
          <option value="__custom">Autre / pas dans la liste…</option>
        </select>

        {/* Champ texte libre activé UNIQUEMENT si "Autre" est choisi.
            Évite que l'user remplisse les 2 (dropdown ET texte) et qu'on
            ne sache pas lequel privilégier. */}
        {selectedClubId === '__custom' && (
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            maxLength={80}
            placeholder="ex : Amiens centre, à côté du carrefour..."
            className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        )}
      </div>

      {/* ============================================
          Niveau recherché : chips presets + champ libre
          ============================================
          Les chips pré-remplissent le champ → l'user peut affiner ensuite.
          Pourquoi pas un select strict ? Parce que les gens veulent parfois
          écrire "P25-P50" ou "ouvert aux progressants" → garde la liberté. */}
      <div>
        <label htmlFor="level_wanted" className="block text-sm font-medium mb-1.5">
          Niveau recherché chez le partenaire
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {LEVEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setLevelWanted(preset)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                levelWanted === preset
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          id="level_wanted"
          type="text"
          value={levelWanted}
          onChange={(e) => setLevelWanted(e.target.value)}
          maxLength={50}
          placeholder="Ou écris un niveau personnalisé…"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-1.5">
          Commentaire (optionnel)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={500}
          placeholder="Je cherche un partenaire régulier, double mixte, pour un Americano..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Publication...' : 'Publier mon annonce'}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Ton email reste privé. Les joueurs te contacteront en cliquant sur ton annonce
        (seuls les utilisateurs connectés voient ton contact complet).
      </p>
    </form>
  );
}
