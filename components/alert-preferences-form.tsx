// ============================================
// Formulaire "Mes alertes tournois" — section /profil
// ============================================
// Client component qui charge les prefs au mount, permet à l'utilisateur
// de cocher catégories/genres/distance, et persiste via PUT API.
//
// UX :
//   - Toggle global "Activer les alertes" en haut → si OFF, on grise le reste
//   - Slider distance avec valeur affichée
//   - Pills catégories (P25 à P2000) + pills genres (M / D / Mixte)
//   - Bouton "Enregistrer" sticky en bas
//
// Pas d'auto-save : Hugo le user veut savoir explicitement quand il
// confirme (par mesure de prudence sur les alertes email).

'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Save } from 'lucide-react';
import { toast } from 'sonner';

import { CATEGORIES, GENDERS } from '@/types/tournament';
import { DEFAULT_ALERT_PREFERENCES, type AlertPreferences } from '@/types/alert';
import { cn } from '@/lib/utils';

const GENDER_LABELS: Record<string, string> = {
  messieurs: 'Messieurs',
  dames: 'Dames',
  mixte: 'Mixte',
};

export function AlertPreferencesForm() {
  const [prefs, setPrefs] = useState<AlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Charge les prefs au mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/alerts/preferences', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { preferences: AlertPreferences }) => {
        if (!cancelled) {
          setPrefs(data.preferences);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updatePrefs<K extends keyof AlertPreferences>(
    key: K,
    value: AlertPreferences[K]
  ) {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
    setDirty(true);
  }

  function toggleCategory(cat: string) {
    if (!prefs) return;
    const has = prefs.categories.includes(cat);
    updatePrefs(
      'categories',
      has ? prefs.categories.filter((c) => c !== cat) : [...prefs.categories, cat]
    );
  }

  function toggleGender(g: string) {
    if (!prefs) return;
    const has = prefs.genders.includes(g);
    updatePrefs(
      'genders',
      has ? prefs.genders.filter((x) => x !== g) : [...prefs.genders, g]
    );
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await fetch('/api/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: prefs.enabled,
          max_distance_km: prefs.max_distance_km,
          categories: prefs.categories,
          genders: prefs.genders,
        }),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Sauvegarde échouée');
      }
      toast.success('Alertes mises à jour');
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="text-sm text-muted-foreground">Chargement des alertes...</div>
    );
  }

  // Si le user active les alertes mais n'a rien coché en catégories, on
  // l'aide à comprendre que c'est inutilisable en l'état
  const incoherent = prefs.enabled && prefs.categories.length === 0;

  return (
    <div className="space-y-5">
      {/* Toggle global */}
      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3 min-w-0">
          {prefs.enabled ? (
            <Bell className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm">
              Recevoir des alertes par email
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              On t&apos;envoie un seul email par jour (max), uniquement si de
              nouveaux tournois matchent tes critères.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => updatePrefs('enabled', !prefs.enabled)}
          aria-pressed={prefs.enabled}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform',
              prefs.enabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Contenu : grisé si désactivé pour signaler que rien ne sera envoyé */}
      <div className={cn('space-y-5', !prefs.enabled && 'opacity-50 pointer-events-none')}>
        {/* Distance maximale */}
        <div>
          <label htmlFor="max_dist" className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Distance maximale (depuis Amiens)</span>
            <span className="text-sm font-semibold text-emerald-700">
              {prefs.max_distance_km === 0
                ? 'Toutes distances'
                : `≤ ${prefs.max_distance_km} km`}
            </span>
          </label>
          <input
            id="max_dist"
            type="range"
            min={0}
            max={200}
            step={10}
            value={prefs.max_distance_km}
            onChange={(e) => updatePrefs('max_distance_km', Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0 km</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200 km</span>
          </div>
        </div>

        {/* Catégories souhaitées */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Catégories FFT</span>
            <button
              type="button"
              onClick={() =>
                updatePrefs(
                  'categories',
                  prefs.categories.length === CATEGORIES.length ? [] : [...CATEGORIES]
                )
              }
              className="text-xs text-emerald-700 hover:underline"
            >
              {prefs.categories.length === CATEGORIES.length
                ? 'Tout décocher'
                : 'Tout cocher'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = prefs.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {prefs.categories.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Coche au moins une catégorie pour recevoir des alertes.
            </p>
          )}
        </div>

        {/* Genres souhaités */}
        <div>
          <div className="text-sm font-medium mb-2">Genres</div>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => {
              const active = prefs.genders.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGender(g)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {GENDER_LABELS[g] ?? g}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aucun coché = on t&apos;envoie tous les genres.
          </p>
        </div>
      </div>

      {/* Warning si activé mais aucune catégorie */}
      {incoherent && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Tu as activé les alertes mais aucune catégorie n&apos;est cochée. Tu ne
          recevras rien tant que tu n&apos;en sélectionnes pas au moins une.
        </div>
      )}

      {/* Bouton enregistrer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {prefs.last_sent_at && (
          <p className="text-xs text-muted-foreground">
            Dernière alerte : {new Date(prefs.last_sent_at).toLocaleDateString('fr-FR')}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </button>
      </div>
    </div>
  );
}

export default AlertPreferencesForm;
