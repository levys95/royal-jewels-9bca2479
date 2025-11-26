# 💎 Royal Jewels – Boutique de bijoux en ligne

Royal Jewels est une application e-commerce moderne dédiée à la vente de bijoux haut de gamme  
(bracelets, colliers, bagues…) avec une identité visuelle “royale” (bleu profond, or, lumières élégantes).

Ce projet a été réalisé dans le cadre d’un module UML / développement web à l’ESGI, en groupe de 3.

---

## ✨ Fonctionnalités principales

### Côté client

- Consultation du **catalogue** de bijoux
- **Filtre** par catégorie / prix / nouveautés
- **Recherche** de produits
- **Fiche produit détaillée** : photos, description, prix, stock
- Gestion du **panier** (ajout, suppression, modification de quantité)
- Gestion des **favoris**
- **Inscription / connexion** via Supabase Auth
- **Passage de commande** avec paiement en ligne (Stripe)
- Consultation de l’**historique de commandes**
- Gestion du **profil utilisateur**

### Côté administrateur

- Accès à un **back-office sécurisé**
- CRUD **produits** (création, modification, suppression, images)
- Gestion des **catégories**
- Consultation et mise à jour des **commandes** (statut)
- Gestion des **utilisateurs** et de leurs rôles (client / admin / livreur…)
- Accès à des **logs** et indicateurs (statistiques de base)

---

## 🧱 Stack technique

Front-end :

- ⚛️ **React** + **TypeScript**
- ⚡ **Vite**
- 🎨 **Tailwind CSS** + **shadcn-ui** pour les composants
- 🧭 **React Router** pour le routage
- 📡 **TanStack Query (React Query)** pour la gestion des requêtes & cache

Back-end / Data :

- 🐘 **Supabase** (PostgreSQL + Auth + API REST + RLS) – dossier [`supabase/`](./supabase)

Paiement :

- 💳 **Stripe** (PaymentIntent, client JS)

Outils :

- 🧪 ESLint, TypeScript config
- 🧵 Git / GitHub

---

## 🗂 Structure du projet

```text
royal-jewels-9bca2479/
├─ public/           # Assets statiques (icônes, favicons, images publiques)
├─ src/              # Code front React/TS
│  ├─ components/    # Composants réutilisables (UI, layouts…)
│  ├─ pages/         # Pages (catalogue, produit, panier, profil, admin…)
│  ├─ hooks/         # Hooks personnalisés (auth, produits, panier…)
│  ├─ lib/           # Clients API, helpers, config Supabase/Stripe
│  ├─ routes/        # Définition des routes
│  └─ main.tsx       # Point d’entrée React
├─ supabase/         # Migrations SQL, tables, politiques RLS, fonctions
├─ .env.example      # Exemple de configuration des variables d’environnement
├─ package.json
├─ tailwind.config.ts
└─ vite.config.ts
```
🚀 Démarrage rapide (local)
1. Prérequis

Node.js (version récente, 18+ conseillé)

npm ou bun

Un compte Supabase

Un compte Stripe (mode test)

2. Cloner le dépôt
```text
git clone https://github.com/levys95/royal-jewels-9bca2479.git
cd royal-jewels-9bca2479
```
3. Installer les dépendances
```text
npm install
# ou
bun install
```
4. Configuration des variables d’environnement

Dupliquer le fichier :
```
cp .env.example .env
```
5. Lancer le projet en développement
```
npm run dev
```
L’application sera disponible sur une URL du type :
```
http://localhost:5173
```
6. Build de production
```
npm run build
npm run preview
```
🔐 Sécurité & Rôles

    Authentification gérée par Supabase Auth (email / mot de passe)
    Row Level Security (RLS) activée sur les tables sensibles
    Rôles appliqués dans la BDD (ex : client, admin, livreur)
    Stripe gère les données de cartes bancaires (aucune carte ne passe par notre serveur)

🧪 Tests manuels (recette)

Quelques cas testés :

    Navigation entre les pages (Accueil, Catalogue, Produit, Panier, Profil, Admin)
    Inscription + Connexion + Déconnexion
    Ajout / suppression de produits dans le panier
    Ajout / suppression de favoris
    Passage d’une commande complète (Stripe en mode test)
    Gestion des produits et catégories côté admin
    Changement de statut de commande (en attente → payée → expédiée…)



```text
👥 Crédits

Projet réalisé par un groupe de 3 étudiants à l’ESGI :

SABAK Lévy - BEDI Bénie Marie Emmanuella - KOUDJINA Bill-Axel
```
