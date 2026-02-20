# 🎴 Générateur de Cartes Munchkin

> 🌐 [Read in English](README.md)

Un générateur de cartes Munchkin personnalisées avec intelligence artificielle, permettant de créer, éditer et exporter vos propres cartes de jeu.

### **[🎮 Essayer en ligne → niveau10.ovh](https://niveau10.ovh)**

[![CI](https://github.com/chichekebbab/cardgenerator/actions/workflows/ci.yml/badge.svg)](https://github.com/chichekebbab/cardgenerator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)

---

## ✨ Fonctionnalités

- 🎨 **Génération d'images par IA** : Utilisez Google Gemini pour générer des images uniques
- ✂️ **Suppression d'arrière-plan** : Intégration de l'API Remove.bg pour des images professionnelles
- 🃏 **Types de cartes variés** : Monstres, Trésors, Malédictions, Bonus Donjon, et plus
- 📊 **Gestion de deck** : Organisez vos cartes par catégories et suivez votre progression
- 💾 **Import/Export** : Importez depuis CSV/JSON et exportez en masse vos cartes
- 🎯 **Aperçu en temps réel** : Visualisez vos modifications instantanément
- 🌐 **Interface française** : Application entièrement en français
- 📱 **Responsive** : Fonctionne sur desktop, tablette et mobile

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** (version 20 ou supérieure)
- **Clés API** (optionnelles) :
  - [Clé API Google Gemini](https://aistudio.google.com/app/apikey) - pour la génération d'images
  - [Clé API Remove.bg](https://www.remove.bg/api) - pour la suppression d'arrière-plan

  > **Note** : Les clés API peuvent être fournies de deux manières :
  >
  > 1. **Côté serveur** : Via `.env.local` pour le développement local ou variables d'environnement en production
  > 2. **Côté client** : Directement par l'utilisateur via l'interface de paramètres (stockées dans le navigateur)

### Installation

1. **Cloner le repository**

   ```bash
   git clone https://github.com/chichekebbab/cardgenerator.git
   cd cardgenerator
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** (optionnel)

   Si vous souhaitez configurer les clés API côté serveur, copiez le fichier `.env.example` vers `.env.local` :

   ```bash
   cp .env.example .env.local
   ```

   Éditez `.env.local` et ajoutez vos clés API :

   ```env
   VITE_GEMINI_API_KEY=votre_clé_gemini_ici
   VITE_REMOVE_BG_API_KEY=votre_clé_removebg_ici
   ```

   > **Alternative** : Vous pouvez sauter cette étape et configurer les clés directement via l'interface de l'application (roue des paramètres).

4. **Lancer l'application en mode développement**

   ```bash
   npm run dev
   ```

   L'application sera accessible sur `http://localhost:5173`

5. **Builder pour la production**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔑 Configuration des clés API

L'application supporte **deux modes de configuration** pour les clés API :

### Mode 1 : Configuration par l'utilisateur (recommandé pour production)

Les utilisateurs peuvent configurer leurs propres clés API directement via l'interface :

1. Cliquez sur l'icône **⚙️ Paramètres** dans l'application
2. Renseignez vos clés API :
   - **Gemini API** : Pour la génération d'images IA
   - **Remove.bg API** : Pour la suppression d'arrière-plan
3. Les clés sont **stockées localement** dans le navigateur (localStorage)
4. Aucune configuration serveur requise !

**Avantages** :

- ✅ Chaque utilisateur utilise ses propres quotas API
- ✅ Pas besoin de partager vos clés
- ✅ Parfait pour un déploiement public

### Mode 2 : Configuration serveur (développement local)

Pour le développement local, vous pouvez configurer des clés par défaut :

#### Google Gemini API

1. Visitez [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Créez une nouvelle clé API
3. Ajoutez-la dans `.env.local` comme `VITE_GEMINI_API_KEY`

#### Remove.bg API

1. Créez un compte sur [Remove.bg](https://www.remove.bg/users/sign_up)
2. Accédez à votre [API Dashboard](https://www.remove.bg/api)
3. Copiez votre clé API
4. Ajoutez-la dans `.env.local` comme `VITE_REMOVE_BG_API_KEY`

**Note** : Ces clés seront intégrées au build et utilisées comme fallback si l'utilisateur n'a pas configuré ses propres clés.

> **⚠️ Avertissement de sécurité** : Les clés API configurées via `.env` sont intégrées dans le bundle JavaScript côté client (via `import.meta.env`). Elles sont donc **visibles par quiconque inspecte le code source** de l'application déployée. Pour un déploiement public, il est **fortement recommandé** de ne PAS configurer de clés serveur et de laisser les utilisateurs fournir leurs propres clés via l'interface.

---

## 📦 Déploiement

### Déploiement sur Netlify

1. **Via l'interface Netlify** :
   - Connectez votre repository GitHub
   - Build command : `npm run build`
   - Publish directory : `dist`
   - Variables d'environnement (optionnelles) : Ajoutez `VITE_GEMINI_API_KEY` et `VITE_REMOVE_BG_API_KEY` si vous voulez des clés serveur par défaut

2. **Via Netlify CLI** :
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

**Note** : Les variables d'environnement sont optionnelles. Si vous ne les configurez pas, les utilisateurs devront fournir leurs propres clés API via l'interface de l'application.

### Déploiement sur Google Cloud Run

Le projet inclut une configuration complète pour Cloud Run :

1. **Prérequis** :
   - Projet Google Cloud configuré
   - Cloud Build et Cloud Run activés
   - Repository connecté à Cloud Build

2. **Configuration** :
   - Le fichier `cloudbuild.yaml` est déjà configuré
   - Variables de substitution (optionnelles) : Dans Cloud Build Triggers, vous pouvez ajouter :
     - `_VITE_GEMINI_API_KEY` (optionnel)
     - `_VITE_REMOVE_BG_API_KEY` (optionnel)
   - Si non configurées, les utilisateurs devront fournir leurs clés via l'interface

3. **Déploiement automatique** :
   - Chaque push sur la branche `main` déclenche un déploiement automatique
   - L'image Docker est construite et déployée sur Cloud Run

---

## 🛠️ Technologies utilisées

- **Frontend** : React 19 avec TypeScript
- **Build** : Vite 6
- **Génération d'images** : Google Gemini API
- **Suppression d'arrière-plan** : Remove.bg API
- **Export** : html-to-image, html2canvas, JSZip
- **Hébergement** : Netlify / Google Cloud Run

---

## 📁 Structure du projet

```
générateur-de-cartes-munchkin/
├── components/              # Composants React
│   ├── CardForm.tsx         # Formulaire d'édition de cartes
│   ├── CardGallery.tsx      # Galerie de cartes
│   ├── CardPreview.tsx      # Aperçu des cartes
│   ├── CardList.tsx         # Liste détaillée des cartes
│   ├── DeckStats.tsx        # Tableau de bord statistiques
│   ├── ImportModal.tsx      # Import CSV/JSON
│   ├── BatchExportRenderer.tsx    # Export PNG en masse
│   ├── BatchPdfExportRenderer.tsx # Export PDF en masse
│   └── ...
├── services/                # Services API
│   ├── geminiService.ts     # Service Google Gemini
│   ├── removeBgService.ts   # Service Remove.bg
│   └── sheetService.ts      # Service Google Sheets
├── utils/                   # Utilitaires
│   ├── layoutUtils.ts       # Gestion des layouts et noms de fichiers
│   ├── balancingConfig.ts   # Configuration d'équilibrage
│   ├── baseDeckConfig.ts    # Configuration du deck de base
│   └── goldFormatter.ts     # Formatage des trésors/or
├── tests/                   # Tests unitaires (Vitest)
├── public/                  # Assets publics (layouts, textures)
├── .github/                 # CI/CD, templates issues/PR
├── types.ts                 # Types TypeScript
├── App.tsx                  # Composant principal
├── Dockerfile               # Configuration Docker
├── cloudbuild.yaml          # Configuration Cloud Build
├── netlify.toml             # Configuration Netlify
└── package.json             # Dépendances
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez le guide complet dans [CONTRIBUTING.md](CONTRIBUTING.md).

En résumé :

1. Fork le projet
2. Créer une branche (`git checkout -b feat/amazing-feature`)
3. Commit vos changements (`git commit -m 'feat: add some amazing feature'`)
4. Push vers la branche (`git push origin feat/amazing-feature`)
5. Ouvrir une Pull Request

### Scripts utiles

```bash
npm run dev          # Serveur de développement
npm run lint         # Vérifier le code
npm run test:ci      # Lancer les tests
npm run build        # Build de production
```

---

## ⚠️ Disclaimer

Ce projet est un **outil non-officiel** créé par des fans. **Munchkin** est une marque déposée de Steve Jackson Games. Ce générateur de cartes n'est pas affilié, approuvé ou sponsorisé par Steve Jackson Games.

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Auteur

**chichekebbab**

- GitHub : [@chichekebbab](https://github.com/chichekebbab)
- Repository : [cardgenerator](https://github.com/chichekebbab/cardgenerator)

---

## 🙏 Remerciements

- [Steve Jackson Games](http://www.sjgames.com/) pour le jeu Munchkin original
- [Google Gemini](https://ai.google.dev/) pour l'API de génération d'images
- [Remove.bg](https://www.remove.bg/) pour l'API de suppression d'arrière-plan
- La communauté open-source pour les outils et bibliothèques utilisés

---

**Amusez-vous bien à créer vos cartes Munchkin personnalisées ! 🎲✨**
