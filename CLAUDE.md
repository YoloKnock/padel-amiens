# CLAUDE.md — Instructions pour Claude Code

> Lis ce fichier en premier à chaque ouverture du projet. Il contient le contexte produit, l'architecture, les conventions, et les libs à utiliser. Mets à jour ce fichier quand tu ajoutes une feature majeure ou quand tu prends une décision d'architecture.

---

## 1. Le produit en une phrase

**Padel Amiens** : la plateforme communautaire des padelistes amiénois et picards. Agrège les tournois homologués FFT et les événements non-homologués (Americano, journées portes ouvertes) des centres à 30 km autour d'Amiens.

**Ce que c'est PAS** : un concurrent d'Anybuddy / Playtomic. On ne fait pas de réservation de créneaux, on ne touche pas aux paiements. On agrège uniquement de l'information publique pour la rendre exploitable localement.

## 2. À qui je parle

Tu parles à **Hugo**, étudiant en ingénierie en stage chez Airbus Atlantic. Il code mais n'est pas développeur pro. Conséquences directes :

- **Commente le code en français.** Toujours.
- **Explique les choix d'architecture** quand tu en fais un (en quelques lignes en prose, pas en bullet liste indigeste).
- **Privilégie des techs simples et modernes** : ne sors pas une lib obscure si une solution standard existe.
- **Fais des commits réguliers avec messages clairs en français.** Format : `type: description courte` (ex : `feat: ajoute le filtre par catégorie`, `fix: corrige le parsing des dates Padel Magazine`, `refactor: extrait le scraper dans lib/`).
- **Pousse en retour** : si Hugo te demande quelque chose qui te paraît mal architecturé, dis-le-lui avant de coder.

## 3. Stack technique et POURQUOI

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SEO local critique (les gens vont chercher "tournoi padel Amiens" sur Google), SSR/SSG natif, écosystème React que Hugo connaît déjà. |
| Langage | **TypeScript** | Sécurité, autocomplétion, indispensable pour scrapping fiable. |
| Styles | **Tailwind CSS** | Hugo le maîtrise déjà, productivité maximale, pas de CSS-in-JS overengineered. |
| Composants UI | **shadcn/ui** | Standard 2025-2026 React/Tailwind, copié-collé dans le repo (pas une dépendance), customisable à 100%. |
| Icônes | **lucide-react** | Cohérent avec shadcn/ui, modernes, tree-shakable. |
| Animations | **framer-motion** | Animations fluides pour les transitions et hover. À utiliser avec parcimonie. |
| Base de données | **Supabase (Postgres)** | Hugo l'utilise déjà sur LifeQuest, API REST auto-générée, auth gratuite, plan free généreux. |
| Carte | **react-leaflet** | Gratuit (vs Mapbox payant au-delà de 50k vues/mois), tuiles OpenStreetMap libres. |
| Scraping | **cheerio** | Standard pour le parsing HTML côté Node, syntaxe jQuery familière. |
| Validation | **zod** | Validation runtime des données scrapées + types TypeScript dérivés. |
| Dates | **date-fns** | Manipulation de dates avec locale française. |
| Toasts | **sonner** | UX moderne, intégré shadcn/ui. |
| Hébergement | **Vercel** | Déploiement git-push, cron jobs natifs, Hugo a déjà le compte connecté. |
| Cron | **Vercel Cron Jobs** | Configuré dans `vercel.json`, gratuit pour 2 jobs quotidiens en plan Hobby. |

## 4. Repos GitHub d'inspiration UI/UX à mater

Quand tu codes des composants, va t'inspirer (sans copier servilement) de :

- **shadcn/ui examples** : https://github.com/shadcn-ui/ui/tree/main/apps/www/registry/default/example
- **Vercel Commerce** : https://github.com/vercel/commerce — patterns Next.js + Tailwind propres
- **shadcn/ui v0 templates** : https://v0.dev — pour générer des composants à partir de prompts
- **Magic UI** : https://github.com/magicuidesign/magicui — animations stylées pour landing pages
- **Tremor** : https://github.com/tremorlabs/tremor — composants dataviz si on ajoute des stats
- **Origin UI** : https://originui.com — composants Tailwind premium gratuits

**Règle** : si tu cherches "comment faire un beau Card de tournoi", commence par checker shadcn/ui Card + Magic UI Bento Grid avant de réinventer la roue.

## 5. Architecture & flux de données

```
                                          ┌──────────────────────────┐
                                          │  Padel Magazine (HTML)   │
                                          │  tournois.padelmagazine  │
                                          │  .fr/ligues/hauts-de-fr  │
                                          └────────────┬─────────────┘
                                                       │ scrape (cheerio)
                                                       │ toutes les 6h
                                                       ▼
   Utilisateur ─▶ Frontend Next.js ─▶ /api/tournaments ─▶ Supabase Postgres
        ▲              (page.tsx)                              ▲
        │                                                       │
        │                                              upsert depuis
        │                                              /api/cron/scrape-tournaments
        │                                              (déclenché par Vercel Cron)
        │
        └─ Filtre côté client (catégorie, genre, date, distance)
```

**Pourquoi cette archi** : on découple le scraping du runtime utilisateur. Si Padel Magazine tombe, le site continue de tourner avec les données fraîches en DB. Les requêtes utilisateur restent rapides parce qu'elles tapent uniquement Supabase, pas la source.

## 6. Structure du projet

```
padel-amiens/
├── app/
│   ├── layout.tsx              # Layout racine (fonts, providers, analytics)
│   ├── page.tsx                # Page d'accueil — liste des tournois
│   ├── globals.css             # Variables CSS + Tailwind
│   └── api/
│       ├── cron/
│       │   └── scrape-tournaments/
│       │       └── route.ts    # Endpoint cron Vercel — déclenche le scraper
│       └── tournaments/
│           └── route.ts        # API pour fetch les tournois (SSR + client)
├── components/
│   ├── tournament-card.tsx     # Card d'un tournoi
│   ├── tournament-list.tsx     # Liste filtrable
│   ├── filters.tsx             # Composant filtres (catégorie, genre, etc.)
│   ├── header.tsx              # Header du site
│   └── ui/                     # Composants shadcn/ui (button, badge, card...)
├── lib/
│   ├── supabase.ts             # Client Supabase (server + client)
│   ├── scraper.ts              # Logique de scraping Padel Magazine
│   ├── geo.ts                  # Calcul de distance à Cagny + géocodage codes postaux
│   ├── utils.ts                # cn() helper shadcn + utilitaires divers
│   └── constants.ts            # Constantes (URL source, position Cagny, catégories)
├── types/
│   └── tournament.ts           # Types TypeScript + schémas Zod
├── supabase/
│   └── schema.sql              # Schéma DB à exécuter dans Supabase Studio
├── scripts/
│   └── scrape-once.ts          # Script de scraping en local pour debug
├── .env.example                # Variables d'environnement à copier
├── CLAUDE.md                   # Ce fichier
├── README.md                   # Documentation utilisateur
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── vercel.json                 # Config cron jobs Vercel
└── components.json             # Config shadcn/ui
```

## 7. Commandes utiles

```bash
# Installation
npm install

# Dev local (port 3000)
npm run dev

# Build production
npm run build

# Lance le scraper UNE FOIS en local (debug)
npm run scrape

# Lint
npm run lint

# Ajouter un composant shadcn/ui
npx shadcn@latest add button
npx shadcn@latest add card
# Liste complète : https://ui.shadcn.com/docs/components
```

## 8. Workflow Git

- **Branche principale** : `main`. Jamais directement, on passe par des branches `feat/`, `fix/`, `refactor/`.
- **Commits** : petits et atomiques. Un commit = une intention claire. Message en français. Format `type: description`.
- **Types acceptés** : `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`.
- **Push fréquent** : à chaque feature qui marche, on commit et on push. Pas de gros commits monolithiques.
- **Avant push** : `npm run build` doit passer. `npm run lint` doit passer.

Exemples de bons messages :
```
feat: ajoute le filtre par catégorie de tournoi
feat(scraper): parse les emails de contact des organisateurs
fix: corrige l'affichage des dates en mobile
refactor(lib): extrait le calcul de distance dans geo.ts
chore: met à jour les dépendances Next.js
docs(claude): ajoute les commandes shadcn dans le CLAUDE.md
```

## 9. MCPs disponibles à Hugo (à exploiter dans Claude Code)

Hugo a connecté plusieurs MCP servers dans Claude.ai. **À sa demande**, il peut les exposer aussi à Claude Code via la commande `claude mcp add`. Liste utile :

- **Vercel MCP** : déjà connecté côté Hugo. Permet de déployer, voir les logs, lister les déploiements directement depuis Claude Code. À installer en local : `claude mcp add --transport http vercel https://mcp.vercel.com`
- **Supabase MCP** : à installer pour gérer la DB depuis Claude Code (créer des tables, exécuter des SQL). Voir https://github.com/supabase-community/supabase-mcp
- **GitHub MCP** : pour créer des PR, gérer les issues. Voir https://github.com/github/github-mcp-server

**Quand utiliser un MCP plutôt que la CLI** : pour les actions répétitives (déploiement, query DB, push de PR). Pour les actions ponctuelles, la CLI suffit.

## 10. Conventions de code

### Imports
```ts
// 1. Imports de packages externes
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// 2. Imports internes (alias @/)
import { cn } from '@/lib/utils';
import { TournamentCard } from '@/components/tournament-card';

// 3. Imports de types
import type { Tournament } from '@/types/tournament';
```

### Composants
- Composants serveur par défaut (pas de `'use client'` sauf si nécessaire).
- `'use client'` UNIQUEMENT pour les composants qui ont besoin de hooks React, événements, ou state local.
- Props typées explicitement avec une interface ou un type.

### Naming
- Fichiers composants : `kebab-case.tsx` (ex : `tournament-card.tsx`).
- Composants exportés : `PascalCase` (ex : `export function TournamentCard()`).
- Fonctions utilitaires : `camelCase`.
- Constantes : `UPPER_SNAKE_CASE`.

### Erreurs
- Toutes les fonctions async qui peuvent fail wrappées dans try/catch.
- Logger les erreurs avec `console.error` côté serveur, afficher un toast côté client.
- Jamais de `as any` sans commentaire qui justifie pourquoi.

## 11. Roadmap des Briques

### ✅ Brique 1 — MVP Calendrier (en cours)
- [x] Scaffold du projet
- [ ] Schéma Supabase + insertion clubs/tournois
- [ ] Scraper Padel Magazine fonctionnel
- [ ] Page d'accueil avec liste des tournois
- [ ] Filtres : catégorie (P25/P50/P100/...), genre, période
- [ ] Filtre géographique (rayon autour de Cagny)
- [ ] Déploiement Vercel + domaine

### 🔜 Brique 2 — Events non-homologués (prochain weekend)
- [ ] Scraping Instagram via Graph API ou alternative légale
- [ ] Saisie manuelle pour events Americano
- [ ] Mini back-office pour les centres (auth Supabase admin)
- [ ] Filtre type d'event (homologué vs Americano vs initiation)

### 🔜 Brique 3 — Communauté & Matchmaking
- [ ] Auth Supabase (Magic Link)
- [ ] Profil joueur (niveau, dispo, club fav)
- [ ] Feature "je cherche un partenaire"
- [ ] Discord/Slack intégré ou messagerie interne

## 12. Variables d'environnement

Voir `.env.example`. Toutes les variables doivent être documentées là-bas.

**Sécurité critique** :
- `SUPABASE_SERVICE_ROLE_KEY` : NE JAMAIS l'exposer côté client. Uniquement dans les API routes Next.js.
- `CRON_SECRET` : token pour authentifier les requêtes du cron Vercel. Sans ça, n'importe qui pourrait déclencher le scraper.

## 13. Quoi faire si je suis bloqué

1. **Lis ce fichier** — la réponse est probablement déjà ici.
2. **Lis le README.md** — pour les commandes setup.
3. **Demande à Hugo** — il préfère qu'on lui pose une question avant de partir dans la mauvaise direction.
4. **Vérifie la doc officielle** : Next.js, Supabase, Tailwind, shadcn/ui.
5. **Cherche un repo qui le fait déjà** — voir section 4 (Repos d'inspiration).

---

**Dernière mise à jour** : 10 mai 2026 — Scaffold initial du projet.
