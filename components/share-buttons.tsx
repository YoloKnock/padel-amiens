// ============================================
// Boutons de partage social — WhatsApp, SMS, X, copier le lien
// ============================================
// Utilisé sur les pages tournoi et club pour donner à l'utilisateur un
// moyen de partager rapidement la fiche à son partenaire de double.
//
// Tous les liens utilisent les URL handlers natifs des plateformes —
// pas de SDK lourd, pas de tracker.

'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle, Send, Share2, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  /** URL absolue de la page à partager. */
  url: string;
  /** Texte par défaut à inclure (titre + date par ex.). */
  message: string;
}

export function ShareButtons({ url, message }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullText = `${message}\n\n${url}`;

  // Liens deep des apps. Tous utilisent encodeURIComponent + texte+url combiné.
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const sms = `sms:?body=${encodeURIComponent(fullText)}`;
  // X (ex Twitter) sépare text et url
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }

  // Si l'API Web Share est dispo (mobile principalement), on propose un
  // bouton "Partager" natif qui ouvre la feuille système. Sinon on liste
  // les boutons par plateforme.
  async function tryNativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: 'Padel Amiens',
          text: message,
          url,
        });
      } catch {
        /* user a annulé, on ignore */
      }
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasNativeShare && (
        <button
          onClick={tryNativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Partager
        </button>
      )}

      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
        title="Partager sur WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>

      <a
        href={sms}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors sm:hidden"
        title="Partager par SMS"
      >
        <Send className="w-4 h-4" />
        SMS
      </a>

      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-100 transition-colors"
        title="Partager sur X"
      >
        <XIcon className="w-4 h-4" />
        X
      </a>

      <button
        onClick={copyToClipboard}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
        title="Copier le lien"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copié' : 'Copier'}
      </button>
    </div>
  );
}
