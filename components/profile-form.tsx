// ============================================
// Formulaire profil utilisateur (création + édition)
// ============================================
// Poste vers /api/profile (POST si nouveau, PATCH si existant). On reste
// sur le pattern simple "form HTML + fetch JSON" déjà utilisé pour les
// events admin, par cohérence.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { PublicProfile } from '@/lib/user';

interface ProfileFormProps {
  profile: PublicProfile | null;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const isNew = profile === null;

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);

    const payload = {
      pseudo: String(formData.get('pseudo') ?? '').trim(),
      level: (String(formData.get('level') ?? '').trim() || null) as string | null,
      city: (String(formData.get('city') ?? '').trim() || null) as string | null,
      contact_phone:
        (String(formData.get('contact_phone') ?? '').trim() || null) as string | null,
      is_adult: formData.get('is_adult') === 'on',
    };

    try {
      const response = await fetch('/api/profile', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.error ?? 'Sauvegarde échouée');
        setSubmitting(false);
        return;
      }

      toast.success(isNew ? 'Profil créé !' : 'Profil mis à jour');
      router.refresh();
      if (isNew) router.push('/matchs');
    } catch (error) {
      console.error('[profile-form] Erreur:', error);
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Email en read-only (info, non éditable) */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Privé. Pas visible des autres joueurs.
        </p>
      </div>

      <div>
        <label htmlFor="pseudo" className="block text-sm font-medium mb-1">
          Pseudo public <span className="text-red-500">*</span>
        </label>
        <input
          id="pseudo"
          name="pseudo"
          type="text"
          required
          minLength={3}
          maxLength={30}
          defaultValue={profile?.pseudo ?? ''}
          placeholder="ex : Hugo80, MissPadel..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="level" className="block text-sm font-medium mb-1">
          Niveau (libre)
        </label>
        <input
          id="level"
          name="level"
          type="text"
          maxLength={50}
          defaultValue={profile?.level ?? ''}
          placeholder="ex : Débutant, P25, P100+, classement FFT..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium mb-1">
          Ville / Zone
        </label>
        <input
          id="city"
          name="city"
          type="text"
          maxLength={80}
          defaultValue={profile?.city ?? ''}
          placeholder="ex : Amiens, Cagny, Abbeville..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium mb-1">
          Téléphone (optionnel, visible aux joueurs connectés)
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          maxLength={20}
          defaultValue={profile?.contact_phone ?? ''}
          placeholder="06 12 34 56 78"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Visible uniquement aux autres utilisateurs <strong>connectés</strong>.
          Les visiteurs non logués ne le voient pas (anti-spam).
        </p>
      </div>

      {/* Confirmation majeur (16+) — RGPD */}
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="is_adult"
          defaultChecked={profile?.is_adult ?? false}
          required
          className="mt-0.5"
        />
        <span>
          Je confirme avoir <strong>16 ans ou plus</strong>.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Sauvegarde...' : isNew ? 'Créer mon profil' : 'Enregistrer'}
      </button>
    </form>
  );
}
