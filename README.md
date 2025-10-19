# Draftmarks

Draftmarks est un prototype d'outil de "read-it-later" qui transforme vos brouillons Gmail en signets enrichis et consultables. L'application s'appuie sur Astro pour l'interface, sur Supabase pour la persistance et sur l'API Gmail pour récupérer le contenu des brouillons.

## Fonctionnalités principales

- **Synchronisation des brouillons Gmail** : extraction des brouillons via l'API Gmail, récupération du corps des messages et nettoyage du HTML. (`src/lib/gmail.ts`)
- **Parsing intelligent** : détection d'URL, normalisation et génération de tags à partir du contenu pour éviter les doublons. (`src/lib/parser.ts`)
- **Enrichissement des métadonnées** : récupération automatique des balises OpenGraph et génération d'URL d'icônes pour illustrer les liens. (`src/lib/metadata.ts`, `src/pages/metadata/[id].ts`)
- **Stockage Supabase** : tables `bookmarks`, `oauth_tokens` et `sessions` pour stocker signets, tokens OAuth et sessions utilisateur. (`supabase.sql`, `src/lib/db.ts`, `src/lib/supabase.ts`)
- **Intégration OAuth Google** : génération de l'URL d'autorisation et échange des codes contre des tokens rafraîchissables. (`src/lib/oauth.ts`)
- **API Astro** : endpoints pour rafraîchir les métadonnées (`src/pages/metadata/[id].ts`) et vérifier l'état de synchronisation (`src/pages/sync/now.ts`).

## Prérequis

- Node.js 20+
- Un projet Supabase avec les tables décrites dans [`supabase.sql`](supabase.sql)
- Un projet Google Cloud avec une application OAuth 2.0 configurée (scopes Gmail `readonly`)

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` (ou utilisez vos secrets de déploiement) contenant :

```
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

> ⚠️ La clé Supabase utilisée ici est la **Service Role Key** : conservez-la côté serveur uniquement.

Ensuite, appliquez le schéma Supabase :

```bash
supabase db push --file supabase.sql
```

## Lancer le projet

```bash
npm run dev
```

Le serveur Astro est accessible sur `http://localhost:4321`. Les composants fournis servent principalement de base pour tester la pipeline de synchronisation.

## Structure du projet

- `src/lib/` : logique métier (Gmail, OAuth, parsers, accès Supabase).
- `src/pages/` : routes Astro et endpoints API.
- `src/components/` : composants UI (Astro + React).
- `supabase.sql` : définition du schéma relationnel.

## Aller plus loin

Quelques pistes pour compléter le prototype :

- Construire une interface de listing pour les signets (recherche, filtres, pagination).
- Ajouter un planificateur de synchronisation (cron) pour interroger Gmail périodiquement.
- Mettre en place un système d'authentification multi-utilisateurs au-dessus de Supabase Auth.
- Déployer sur un hébergeur compatible (par ex. Vercel + Supabase).

Bonne exploration !
