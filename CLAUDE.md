@AGENTS.md

# CLAUDE.md - Directives du Projet BRVM Lead Scraper & Outreach (Leadora)

## 📌 Vision & Objectifs
Application de prospection commerciale B2B haut de gamme pour commercialiser des formations boursières sur la **BRVM (Bourse Régionale des Valeurs Mobilières)**.
L'outil identifie les diplômés et professionnels issus de la **diaspora africaine subsaharienne** résidant au Canada, aux USA et en Europe francophone, enrichit leurs coordonnées professionnelles (emails vérifiés via Dropcontact), et génère des messages d'accroche personnalisés via IA (Claude 3.5 Sonnet).

Design inspiré de l'interface SaaS moderne **Leadora** avec prise en charge complète du **Light Mode** (palette chaude crème/ivoire) et du **Dark Mode** (charbon/ardoise sombre) via `next-themes`.

---

## 🛠️ Stack Technique
- **Frontend / Backend** : Next.js 16 (App Router, Server Actions, Route Handlers, Cache Components, Partial Prerendering) — lire `node_modules/next/dist/docs/` avant d'écrire du code Next (voir AGENTS.md)
- **Design & UI** : Tailwind CSS v4, Lucide React, Shadcn/UI (@base-ui/react, `cn` depuis `@/lib/utils`, Base UI : `onCheckedChange`, pas Radix)
- **Thème & Dark Mode** : `next-themes` avec `ThemeProvider` et `ThemeToggle`
- **Base de données & Auth** : Supabase (PostgreSQL, Tables relationnelles, RLS) — clients dans `lib/supabase/`
- **Moteur d'Extraction** : Apify SDK / Client (Google X-Ray Search - Zéro risque de ban LinkedIn)
- **Enrichissement Email** : Dropcontact Batch API (avec support multi-fournisseurs)
- **Intelligence Artificielle** : Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`) pour le copywriting personnalisé
- **Export Multi-formats** : CSV UTF-8 avec BOM (séparateur `;` pour Excel français) et XLSX stylisé via `exceljs`
- **Tests Unitaires** : Vitest (`vitest.config.mts`) pour toutes les fonctions pures
- **Déploiement** : Vercel (Cron toutes les 10 minutes via `vercel.json`)

---

## 💻 Commandes de Référence
- `npm run dev` : Lance le serveur de développement Next.js
- `npm run build` : Compilation de production Turbopack + vérification stricte TypeScript
- `npm run lint` : Contrôle de qualité de code ESLint
- `npm run test` : Exécution des tests unitaires Vitest
- **Migrations SQL à exécuter dans Supabase SQL Editor** :
  - `supabase/migrations/0001_init.sql` (schéma initial campagnes & leads)
  - `supabase/migrations/0002_extraction.sql` (champs Apify + table `suppression_list`)
  - `supabase/migrations/0003_enrichment.sql` (table `enrichment_jobs`)
  - `supabase/migrations/0004_outreach.sql` (colonne `ai_subject`)

---

## 📋 Règles « À Chaque Fois »
1. **Next.js 16 & Documentation** : Lire `node_modules/next/dist/docs/` avant d'écrire du code Next ; respecter les spécificités de Turbopack, des Server Components et du nouveau middleware (`proxy.ts`).
2. **Suspense & Cache Components** : Toute lecture de cookies, de headers, de searchParams, de route params ou de données Supabase se fait sous un composant `<Suspense>` pour permettre le streaming dynamique. Les hooks URL client (`usePathname()`) dans les layouts sont également sous `<Suspense>`.
3. **Sécurité des Server Actions** : Chaque Server Action appelle systématiquement `requireUser()` (`lib/auth.ts`) et revalide ses entrées contre les données de `lib/data.ts` (le client n'est pas digne de confiance).
4. **Client Supabase Admin** : `createAdminClient()` (`lib/supabase/server.ts`, service_role) est **strictement réservé** aux webhooks asynchrones (`/api/webhooks/apify`) et aux tâches cron (`/api/cron/enrichment`).
5. **Isolation Serveur** : Les services externes vivent dans `lib/services/*` avec la directive `import "server-only"`. Les clés API (`APIFY_TOKEN`, `DROPCONTACT_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`) restent exclusivement côté serveur.
6. **Interface & Composants** : L'interface utilisateur est entièrement rédigée en français soigné, utilisant les composants shadcn de `components/ui` basés sur `@base-ui/react` (attention : `onCheckedChange`, pas Radix).
7. **Fonctions Pures & Tests** : Toutes les fonctions pures (requêtes X-Ray, parsing LinkedIn, scoring factuel UEMOA, export CSV) ont des tests unitaires Vitest dédiés dans `tests/`.

---

## ⚖️ Conformité RGPD, nLPD & Déontologie
- **Aucune inférence d'origine** : Il est formellement interdit de déduire, stocker ou afficher une origine ethnique, raciale ou nationale supposée (RGPD art. 9).
- **Score factuel auditable** : Le score d'affinité UEMOA (`uemoa_affinity_score`, 0-100) repose à 100 % sur des faits publics avérés (diplômes d'écoles africaines, expérience professionnelle dans les pays de la zone, appartenance à un réseau pro officiel).
- **Minimisation des données** : Seuls les profils dont le score atteint ou dépasse le seuil minimal (`MIN_UEMOA_SCORE = 30`) sont enregistrés en base.
- **Liste d'exclusion obligatoire (Suppression List)** : Avant tout enrichissement email, génération de message IA ou export, les adresses et profils présents dans `suppression_list` sont systématiquement écartés.
- **Transparence et désinscription** : Chaque email généré mentionne explicitement la source publique des données et comporte un lien de désinscription unique et sécurisé par jeton HMAC (`/unsubscribe?email=...&token=...`).

---

## 🎯 Règles & Logique Métier

### 1. Sélecteur Géographique & Universitaire Hiérarchique
Source de vérité : `data/universities.json` (Région > Pays > Groupe > Universités).
- **Canada** : Québec (HEC Montréal, Polytechnique, UdeM, McGill...) et Ontario / Hors Québec (uOttawa, Moncton, Toronto...).
- **France** : Écoles de commerce (HEC Paris, ESSEC, ESCP, EDHEC...), Écoles d'ingénieurs (X, CentraleSupélec, Mines, Ponts, INSA...), Universités (Sorbonne, Assas, Dauphine...).
- **Belgique** : ULB, UCLouvain, Solvay, HEC Liège...
- **Suisse** : UNIL, EPFL, UniGe, HEC Lausanne...
- **USA** : Harvard, Columbia, NYU, MIT, Berkeley, Stanford, Wharton...

### 2. Score d'Affinité Marchés UEMOA
Pondération des signaux factuels :
- Écoles & lycées africains (INP-HB, CESAG, UCAD, 2iE, Classique d'Abidjan, Mermoz...) : **+35 pts**
- Expérience professionnelle dans un pays UEMOA (Côte d'Ivoire, Sénégal, Bénin, Togo, Burkina, Mali, Niger, Guinée-Bissau) : **+25 pts**
- Expérience Afrique centrale & Grands Lacs (Cameroun, RDC, Gabon, Congo) : **+15 pts**
- Réseaux pro et clubs affinitaires (RPAC, Club Afrique HEC, Cadres & Dirigeants d'Afrique) : **+20 pts**
- Filière spécifique Maroc (ENCG, EMSI, Al Akhawayn, Hassan II) : **+10 pts** (uniquement si un autre signal subsaharien est validé)
- Métier cible (Finance, Audit, Gestion de portefeuille, Direction) : **+10 pts** (si signal subsaharien présent)
- Plafond strict : **100 pts** | Seuil d'importation : **30 pts** | Aucun signal factuel : **0 pt**.

### 3. Filtre par Groupes & Réseaux
Source de vérité : `data/affinity-groups.json`.
- `cross_filter` : Croise les universités cibles avec les marqueurs africains et les métiers.
- `standalone` : Extrait directement les membres des réseaux professionnels et clubs affinitaires.

---

## 🗄️ Schéma de Base de Données
- `campaigns` : id, name, target_region, target_country, target_universities[], target_roles[], target_groups[], group_mode, batch_size, status (draft | running | completed), apify_run_id, launched_at, last_error, created_at.
- `leads` : id, campaign_id, full_name, first_name, last_name, current_title, current_company, location, linkedin_url (UNIQUE), western_education, uemoa_ties, uemoa_affinity_score (0-100), source_snippet, business_email, email_status (verified | risky | not_found | pending), ai_subject, ai_personalized_message, created_at.
- `suppression_list` : id, email (UNIQUE), linkedin_url (UNIQUE), reason, created_at.
- `enrichment_jobs` : id, campaign_id, provider, external_id, status (pending | completed | failed), lead_ids[], created_at.

---

## 🔑 Variables d'Environnement (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
APIFY_TOKEN=apify_api_xxx
APIFY_WEBHOOK_SECRET=your-apify-webhook-secret
DROPCONTACT_API_KEY=your-dropcontact-api-key
ANTHROPIC_API_KEY=sk-ant-api-xxx
CRON_SECRET=your-cron-secret-token
UNSUBSCRIBE_SECRET=your-hmac-secret-for-unsubscribe
```

---

## 🚀 État d'Avancement des Phases
- **Phase 1 : Configuration & Base de Données (Next.js + Supabase)** ✅
- **Phase 2 : Interface Utilisateur & Formulaires Hiérarchiques** ✅
- **Phase 3 : Extraction Apify (Google X-Ray Search sans risque de ban)** ✅
- **Phase 4 : Score d'Affinité UEMOA Déterministe & Enrichissement Dropcontact** ✅
- **Phase 5 : Accroches IA Personnalisées, Désinscription HMAC & Export Multi-formats** ✅
- **Design Dashboard Leadora & Dark Mode** ✅
