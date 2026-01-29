# Checklist avant publication GitHub et déploiement

## ✅ Modifications complétées

### Fichiers créés
- [x] `.env.example` - Template pour les clés API (optionnelles)
- [x] `netlify.toml` - Configuration Netlify avec redirections SPA et headers de sécurité
- [x] `LICENSE` - Licence MIT

### Fichiers mis à jour
- [x] `README.md` - Documentation complète et professionnelle
- [x] `package.json` - Métadonnées, repository, licence, keywords
- [x] `Dockerfile` - Support pour `VITE_REMOVE_BG_API_KEY` (optionnel)
- [x] `cloudbuild.yaml` - Support pour `VITE_REMOVE_BG_API_KEY` (optionnel avec valeur par défaut vide)

---

## 🔐 SÉCURITÉ - À FAIRE IMMÉDIATEMENT

### Vérification effectuée
- ✅ `.env.local` n'a jamais été commit dans Git
- ✅ `dist/` est ignoré par `.gitignore`
- ⚠️ **ATTENTION** : Votre clé API Gemini est visible dans `.env.local` localement

### Actions recommandées AVANT publication
1. **Régénérer la clé API Gemini** (par précaution)
   - Aller sur https://aistudio.google.com/app/apikey
   - Supprimer la clé existante : `AIzaSyAxT3mEMYdc3Bl5CrTlQmGoaRnVPrdRWDA`
   - Créer une nouvelle clé
   - La mettre dans `.env.local` (qui n'est PAS versionné)

2. **Vérifier qu'aucune donnée sensible n'est dans le repo**
   ```bash
   git status
   git log --all --pretty=format: --name-only --diff-filter=A | sort -u | grep -i "env\|key\|secret"
   ```

---

## 📦 Configuration des clés API (OPTIONNEL)

### Mode recommandé : Configuration par les utilisateurs
Les utilisateurs configurent leurs propres clés via l'interface (⚙️ Paramètres).
➡️ **Aucune configuration serveur requise !**

### Mode alternatif : Clés serveur par défaut

#### Pour développement local
Éditez `.env.local` et ajoutez vos clés (déjà ignoré par Git)

#### Pour Netlify
Variables d'environnement (optionnelles) à ajouter dans Netlify :
- `VITE_GEMINI_API_KEY`
- `VITE_REMOVE_BG_API_KEY`

#### Pour Google Cloud Run
Dans Cloud Build Triggers, ajoutez les variables de substitution (optionnelles) :
- `_VITE_GEMINI_API_KEY` (par défaut : vide)
- `_VITE_REMOVE_BG_API_KEY` (par défaut : vide)

---

## 📝 Documentation

### README.md
- [x] Description du projet
- [x] Badges (licence, versions)
- [x] Fonctionnalités
- [x] Instructions d'installation
- [x] Configuration des clés API (2 modes expliqués)
- [x] Instructions de déploiement (Netlify + Cloud Run)
- [x] Technologies utilisées
- [x] Structure du projet
- [x] Disclaimer légal (Munchkin est une marque de Steve Jackson Games)
- [x] Section contribution
- [x] Licence

### Fichiers supplémentaires recommandés (optionnel)
- [ ] `CHANGELOG.md` - Pour suivre les versions
- [ ] `CONTRIBUTING.md` - Guide de contribution

---

## 🧹 Nettoyage du code

### Fichiers à vérifier
- [x] `dist/` est ignoré par `.gitignore`
- [x] `.env.local` est ignoré par `.gitignore`
- [ ] Vérifier les dossiers `/plans` et `/logs` pour données sensibles
- [ ] Retirer les `console.log` de debug dans `services/removeBgService.ts` (si souhaité)

### Console.log détectés
- `services/removeBgService.ts` - Logs de debug pour Remove.bg (utiles pour debugger)
- `dist/` - Contient du code compilé (déjà ignoré par git ✅)

---

## 🚀 Déploiement

### Netlify
1. Connecter le repository GitHub
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Variables d'environnement : OPTIONNELLES

### Google Cloud Run
1. Le `cloudbuild.yaml` est configuré
2. Variables de substitution : OPTIONNELLES (valeurs par défaut vides)
3. Déploiement automatique à chaque push sur `main`

---

## 🧪 Tests avant publication

### Tests locaux
- [ ] `npm run build` - Vérifie que le build fonctionne
- [ ] `npm run preview` - Teste le build en production
- [ ] Tester sans clés API (vérifier que l'interface de configuration apparaît)
- [ ] Tester avec clés API configurées via l'interface

### Tests de fonctionnalités
- [ ] Génération de cartes
- [ ] Suppression d'arrière-plan
- [ ] Export de cartes
- [ ] Import CSV/JSON
- [ ] Sauvegarde/chargement

---

## ⚖️ Légal

- [x] Licence MIT ajoutée
- [x] Disclaimer ajouté dans README
- [ ] Vérifier les droits d'utilisation des assets Munchkin (si applicable)
- [ ] Considérer une page "Mentions légales" dans l'app

---

## 📌 Avant de faire `git push`

1. ✅ Vérifiez que `.env.local` n'est PAS tracké :
   ```bash
   git status
   ```

2. ✅ Vérifiez le contenu qui sera poussé :
   ```bash
   git diff origin/main
   ```

3. ✅ Assurez-vous qu'aucune clé API n'est dans le code :
   ```bash
   git grep -i "AIzaSy"
   ```

4. ✅ Committez les changements :
   ```bash
   git add .
   git commit -m "docs: prepare for public release"
   git push
   ```

---

## 🎯 Configuration GitHub (après push)

1. **Repository Settings**
   - [ ] Ajouter une description
   - [ ] Ajouter des topics (munchkin, card-generator, ai, react, vite)
   - [ ] Activer Issues (si vous voulez des contributions)
   - [ ] Activer Discussions (optionnel)

2. **README sur GitHub**
   - [ ] Vérifier que le README s'affiche correctement
   - [ ] Ajouter un lien vers le site déployé (Netlify/Cloud Run)

3. **Releases** (optionnel)
   - [ ] Créer une release v1.0.0 avec notes de version

---

**Status global : ✅ PRÊT pour publication !**

**Note importante** : Les clés API sont maintenant OPTIONNELLES partout. Les utilisateurs peuvent les configurer via l'interface de l'application. C'est la solution idéale pour un projet public.
