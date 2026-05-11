// ============================================
// Formulaire de création d'annonce matchmaking
// ============================================
// Client component. Poste vers /api/match-requests. Validation côté serveur
// via Zod.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function MatchRequestForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);

    const payload = {
      when_date: String(formData.get('when_date') ?? '').trim(),
      when_hour: (String(formData.get('when_hour') ?? '').trim() || null) as string | null,
      location: (String(formData.get('location') ?? '').trim() || null) as string | null,
      level_wanted:
        (String(formData.get('level_wanted') ?? '').trim() || null) as string | null,
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
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="when_date" className="block text-sm font-medium mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="when_date"
            name="when_date"
            type="date"
            required
            min={getTodayIso()}
            defaultValue={getTodayIso()}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        <div>
          <label htmlFor="when_hour" className="block text-sm font-medium mb-1">
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

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Lieu / zone
        </label>
        <input
          id="location"
          name="location"
          type="text"
          maxLength={80}
          placeholder="Amiens Padel Cagny, AAC, Multiball..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="level_wanted" className="block text-sm font-medium mb-1">
          Niveau recherché chez le partenaire
        </label>
        <input
          id="level_wanted"
          name="level_wanted"
          type="text"
          maxLength={50}
          placeholder="Débutant ok, P25-P50, tous niveaux..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-1">
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
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
