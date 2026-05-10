// ============================================
// Formulaire de création d'event admin
// ============================================
// Client component qui poste vers /api/events (POST). Validation côté
// client minimale (champs required HTML) + validation forte côté serveur
// via Zod dans l'API route.
//
// On reste sur du HTML/Tailwind brut plutôt que des composants shadcn :
// c'est plus lisible et le formulaire est de toute façon unique dans
// l'app — pas de réutilisation à chercher.

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@/types/event';

interface Club {
  id: string;
  name: string;
  city: string | null;
}

interface AdminEventFormProps {
  clubs: Club[];
}

export function AdminEventForm({ clubs }: AdminEventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);

    // Construction du payload depuis le FormData. On nettoie les strings
    // vides en null pour respecter le schéma Zod (qui accepte null mais
    // pas les "" pour les URLs/emails).
    const cleanedEntries = Array.from(formData.entries()).map(([key, value]) => {
      const stringValue = typeof value === 'string' ? value.trim() : '';
      return [key, stringValue === '' ? null : stringValue] as const;
    });
    const payload = Object.fromEntries(cleanedEntries);

    try {
      const response = await fetch('/api/events', {
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

      toast.success('Événement créé');
      // On rafraîchit la page server-side pour voir le nouvel event dans la liste
      router.refresh();
      // Reset visuel : on retire le DOM le plus simple via reset du form
      (document.getElementById('admin-event-form') as HTMLFormElement)?.reset();
    } catch (error) {
      console.error('[admin/form] Erreur:', error);
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id="admin-event-form"
      action={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Type */}
      <Field label="Type" required>
        <select
          name="event_type"
          required
          defaultValue="americano"
          className={selectClasses}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      {/* Club */}
      <Field label="Club organisateur" required>
        <select name="club_id" required defaultValue="" className={selectClasses}>
          <option value="" disabled>
            — Sélectionner —
          </option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
              {club.city ? ` (${club.city})` : ''}
            </option>
          ))}
        </select>
        {clubs.length === 0 && (
          <p className="text-xs text-amber-700 mt-1">
            Aucun club en base. Lance d&apos;abord le scraper pour avoir des clubs.
          </p>
        )}
      </Field>

      {/* Titre — full width */}
      <Field label="Titre" required className="md:col-span-2">
        <input
          type="text"
          name="title"
          required
          minLength={3}
          maxLength={200}
          placeholder="Americano du samedi matin"
          className={inputClasses}
        />
      </Field>

      {/* Dates */}
      <Field label="Date de début" required>
        <input type="date" name="start_date" required className={inputClasses} />
      </Field>

      <Field label="Date de fin (optionnel)">
        <input type="date" name="end_date" className={inputClasses} />
      </Field>

      {/* Horaires + tarif */}
      <Field label="Horaires (libre)">
        <input
          type="text"
          name="schedule"
          placeholder="9h-12h"
          maxLength={100}
          className={inputClasses}
        />
      </Field>

      <Field label="Tarif (libre)">
        <input
          type="text"
          name="price"
          placeholder="15€ par paire"
          maxLength={100}
          className={inputClasses}
        />
      </Field>

      {/* Niveau */}
      <Field label="Niveau">
        <input
          type="text"
          name="level"
          placeholder="Tous niveaux, P25+, débutants..."
          maxLength={100}
          className={inputClasses}
        />
      </Field>

      {/* URL inscription */}
      <Field label="Lien d'inscription (URL)">
        <input
          type="url"
          name="registration_url"
          placeholder="https://..."
          className={inputClasses}
        />
      </Field>

      {/* Description — full width */}
      <Field label="Description (optionnel)" className="md:col-span-2">
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Format, conditions, infos pratiques..."
          className={inputClasses}
        />
      </Field>

      {/* Contacts */}
      <Field label="Email de contact (si différent du club)">
        <input
          type="email"
          name="contact_email"
          placeholder="contact@example.com"
          className={inputClasses}
        />
      </Field>

      <Field label="Téléphone de contact">
        <input
          type="text"
          name="contact_phone"
          placeholder="06 12 34 56 78"
          maxLength={20}
          className={inputClasses}
        />
      </Field>

      {/* Statut */}
      <Field label="Statut" required>
        <select name="status" defaultValue="draft" className={selectClasses}>
          <option value="draft">Brouillon (invisible)</option>
          <option value="published">Publié (visible publiquement)</option>
        </select>
      </Field>

      {/* Bouton submit — full width */}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting || clubs.length === 0}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Création...' : "Créer l'événement"}
        </button>
      </div>
    </form>
  );
}

// ============================================
// Classes Tailwind partagées
// ============================================
const inputClasses =
  'w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm';

const selectClasses = `${inputClasses} bg-white`;

// ============================================
// Sous-composant : ligne de formulaire avec label
// ============================================
function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
