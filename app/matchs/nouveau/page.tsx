// ============================================
// Formulaire de création d'annonce — /matchs/nouveau
// ============================================
// Nécessite d'être connecté ET d'avoir un profile créé. Si pas de profile,
// on redirige vers /profil pour compléter d'abord.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Header } from '@/components/header';
import { MatchRequestForm } from '@/components/match-request-form';
import { getCurrentProfile, requireUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Poster une annonce',
  robots: { index: false, follow: false },
};

export default async function NouveauMatchPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  // Pas de profil = on force la création avant de pouvoir poster
  if (!profile) redirect('/profil?next=/matchs/nouveau');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        <Link
          href="/matchs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Toutes les annonces
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">Poster une annonce</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tu publies en tant que <strong>{profile.pseudo}</strong>. Les autres
          joueurs verront cette annonce sur la page /matchs pendant 14 jours.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <MatchRequestForm />
        </div>
      </main>
    </div>
  );
}
