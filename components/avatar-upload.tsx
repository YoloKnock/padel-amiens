// ============================================
// AvatarUpload — composant upload de photo de profil
// ============================================
// Indépendant du formulaire principal (Profile-form) parce que l'upload
// est asynchrone et bénéficie d'un feedback instantané : on ne veut pas
// que l'utilisateur attende "Enregistrer" pour voir sa photo apparaître.
//
// Stratégie :
//   - Au choix de fichier : preview locale immédiate (Object URL)
//   - Upload en arrière-plan vers /api/profile/avatar
//   - Quand l'API renvoie l'URL définitive, on l'affiche à la place
//   - En cas d'erreur : toast + rollback à l'ancienne photo

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from './avatar';

interface AvatarUploadProps {
  /** URL actuelle de l'avatar (server-side) */
  currentUrl: string | null;
  /** Pseudo pour le fallback (initiale) */
  pseudo: string;
}

export function AvatarUpload({ currentUrl, pseudo }: AvatarUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // displayedUrl : ce qu'on affiche à l'écran. Bascule entre :
  //   - currentUrl (au mount)
  //   - object URL local (pendant l'upload)
  //   - URL renvoyée par l'API (après succès)
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation client (pour donner un feedback immédiat sans round-trip)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 MB)');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté (jpeg, png, webp)');
      e.target.value = '';
      return;
    }

    // Preview locale immédiate
    const localUrl = URL.createObjectURL(file);
    const previousUrl = displayedUrl;
    setDisplayedUrl(localUrl);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ url: string }>;
      })
      .then((json) => {
        setDisplayedUrl(json.url);
        toast.success('Photo mise à jour');
        // Refresh côté server pour que le Header (RSC) recharge avec le
        // nouvel avatar.
        router.refresh();
      })
      .catch((err: Error) => {
        toast.error(err.message);
        // Rollback : on revient à la photo précédente
        setDisplayedUrl(previousUrl);
      })
      .finally(() => {
        URL.revokeObjectURL(localUrl);
        setUploading(false);
        // Reset l'input pour pouvoir re-sélectionner le même fichier
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  }

  async function handleDelete() {
    if (!confirm('Supprimer ta photo de profil ?')) return;
    const previousUrl = displayedUrl;
    setDisplayedUrl(null);
    setUploading(true);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Suppression échouée');
      toast.success('Photo supprimée');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setDisplayedUrl(previousUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Photo (ou initiale) */}
      <div className="relative">
        <Avatar
          url={displayedUrl}
          name={pseudo}
          size="xl"
          className={uploading ? 'opacity-60' : ''}
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <Camera className="w-4 h-4" />
          {displayedUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        {displayedUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP. 2 MB max.
        </p>
      </div>
    </div>
  );
}
