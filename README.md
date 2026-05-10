# 🎾 Padel Amiens

> La plateforme communautaire des padelistes amiénois et picards.
> Agrège tournois homologués FFT et événements non-homologués des centres à 30 km autour d'Amiens.

## Quick Start

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les variables d'environnement
cp .env.example .env.local
# Puis remplir les valeurs (voir section ci-dessous)

# 3. Initialiser la DB Supabase
# Aller sur https://app.supabase.com → ton projet → SQL Editor
# Coller le contenu de supabase/schema.sql et l'exécuter

# 4. Lancer le scraper une première fois pour avoir des données
npm run scrape

# 5. Lancer le dev server
npm run dev
# → http://localhost:3000
```

## Variables d'environnement

| Variable | Description | Où la trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique du projet Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (lecture publique) | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (écriture serveur) | Supabase → Settings → API → ⚠️ secret |
| `CRON_SECRET` | Token pour authentifier le cron | À générer toi-même : `openssl rand -hex 32` |

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **Supabase** (Postgres + Auth)
- **Vercel** (hosting + cron jobs)
- **cheerio** + **zod** (scraping + validation)

## Pour Claude Code

Lis **`CLAUDE.md`** en premier. Il contient l'architecture, les conventions, et la roadmap.

## Déploiement

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer (la première fois, suis les prompts)
vercel

# Configurer les variables d'env
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET

# Déployer en production
vercel --prod
```

Le cron job de scraping est défini dans `vercel.json` et tournera automatiquement toutes les 6 heures en production.

## Sources de données

- **Padel Magazine** (`tournois.padelmagazine.fr`) : tournois homologués FFT.
- À venir : Instagram, sites des centres pour les événements non-homologués.

## Licence

MIT — projet personnel d'apprentissage.
