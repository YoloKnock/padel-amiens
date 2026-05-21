// ============================================
// FiltersDrawer — drawer mobile pour les filtres
// ============================================
// Sur mobile, les filtres prenaient ~50% de la hauteur d'écran avant que
// le contenu apparaisse. On les pousse dans un drawer qui slide-in du bas
// et qu'on ouvre via un bouton sticky "Filtres".
//
// Pattern Airbnb / Booking mobile. Sur sm+, on rend simplement les
// `children` dans un conteneur normal sans drawer.
//
// Pas de dépendance externe (Radix/Headless UI) — juste du Tailwind + un
// state local + un overlay div. Suffisant pour notre besoin.

'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FiltersDrawerProps {
  /** Contenu des filtres — passé en children depuis le parent.
   *  Sur mobile : rendu dans le drawer. Sur desktop : rendu inline. */
  children: React.ReactNode;
  /** Compteur affiché à côté du bouton "Filtres" sur mobile, pour
   *  signaler combien de filtres sont actifs (ex: "Filtres · 3"). */
  activeCount?: number;
  /** Label du bouton trigger sur mobile. Par défaut "Filtres". */
  triggerLabel?: string;
}

export function FiltersDrawer({
  children,
  activeCount = 0,
  triggerLabel = 'Filtres',
}: FiltersDrawerProps) {
  const [open, setOpen] = useState(false);

  // Bloque le scroll body quand le drawer est ouvert (sinon le contenu en
  // arrière-plan scroll en même temps, c'est désagréable).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Fermeture par touche Escape (a11y standard)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* ============================================
          Mobile : bouton trigger + drawer
          ============================================
          Le bouton est sticky en haut du contenu sur mobile (z-30 pour
          rester au-dessus des cards qui ont leur propre stacking). */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-medium hover:border-emerald-300 transition-colors mb-4"
        >
          <Filter className="w-4 h-4" />
          {triggerLabel}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {/* Drawer animé : overlay + panel slide-in du bas */}
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Overlay : ferme au click hors du panel */}
            <button
              type="button"
              aria-label="Fermer les filtres"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            />

            {/* Panel filtres : 80vh max, scrollable, avec sticky header
                et footer pour les actions. */}
            <div
              className={cn(
                'absolute bottom-0 inset-x-0 max-h-[85vh] flex flex-col',
                'bg-white rounded-t-2xl shadow-2xl',
                'animate-in slide-in-from-bottom duration-300'
              )}
            >
              {/* Indicateur de drag (visuel uniquement) */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden />
              </div>

              {/* Header sticky */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-slate-100">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {triggerLabel}
                  {activeCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({activeCount} actif{activeCount > 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu scrollable des filtres */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {children}
              </div>

              {/* Footer sticky avec CTA "Voir les résultats" */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Voir les résultats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          Desktop : rendu inline (pas de drawer)
          ============================================ */}
      <div className="hidden sm:block">{children}</div>
    </>
  );
}
