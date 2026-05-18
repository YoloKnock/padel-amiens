// ============================================
// API Route — Upload de l'avatar du profil
// ============================================
// POST /api/profile/avatar  (multipart/form-data avec champ "file")
//   → upload dans le bucket Storage `avatars` sous /<user_id>/avatar.<ext>
//   → met à jour profiles.avatar_url avec l'URL publique
//   → renvoie { url: string }
// DELETE /api/profile/avatar
//   → supprime le fichier ET reset profiles.avatar_url à null
//
// Limites :
//   - Image uniquement (jpeg/png/webp)
//   - 2 MB max (le bucket lui-même applique aussi cette limite, ceinture+bretelles)
//   - Upsert : un re-upload remplace le fichier existant (pas d'accumulation)

import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/user';

export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ============================================
// POST — upload nouvelle photo
// ============================================
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image trop lourde (max 2 MB)' },
      { status: 413 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Format non supporté (jpeg, png, webp uniquement)' },
      { status: 415 }
    );
  }

  // Extension dérivée du mime-type — plus fiable que se baser sur le nom de
  // fichier qui peut être tronqué/manquant sur certains navigateurs mobiles.
  const ext =
    file.type === 'image/jpeg' ? 'jpg' :
    file.type === 'image/png'  ? 'png' :
    'webp';
  // Path stable : un seul fichier par user, on l'écrase à chaque upload.
  // Le préfixe user_id correspond exactement à la policy RLS du bucket.
  const path = `${user.id}/avatar.${ext}`;

  const supabase = createAdminClient();

  // Avant d'uploader le nouveau fichier, on supprime les éventuelles
  // anciennes versions avec une autre extension (jpg → png par exemple)
  // pour éviter qu'elles trainent dans le bucket.
  const otherExts = ['jpg', 'png', 'webp'].filter((e) => e !== ext);
  for (const oldExt of otherExts) {
    await supabase.storage
      .from('avatars')
      .remove([`${user.id}/avatar.${oldExt}`]);
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('[avatar POST] upload error:', uploadError);
    return NextResponse.json(
      { error: 'Upload échoué' },
      { status: 500 }
    );
  }

  // URL publique : on récupère la base + on ajoute un query param `v` qui
  // change à chaque upload pour casser le cache du navigateur (sinon il
  // affiche l'ancienne photo après un re-upload).
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  const versioned = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: versioned })
    .eq('id', user.id);

  if (profileError) {
    console.error('[avatar POST] profile update error:', profileError);
    return NextResponse.json(
      { error: 'Mise à jour profil échouée' },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: versioned });
}

// ============================================
// DELETE — retire l'avatar
// ============================================
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // On tente de supprimer toutes les extensions possibles. Le bucket
  // ne crash pas si le fichier n'existe pas.
  await supabase.storage
    .from('avatars')
    .remove([
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
    ]);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (error) {
    console.error('[avatar DELETE]', error);
    return NextResponse.json(
      { error: 'Suppression échouée' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
