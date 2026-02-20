# Contributing / Contribuer

[English](#english) | [Français](#français)

---

## English

Thank you for your interest in contributing to the Munchkin Card Generator!

### Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cardgenerator.git
   cd cardgenerator
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

### Development Workflow

#### Available Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start development server     |
| `npm run build`        | Production build             |
| `npm run lint`         | Run ESLint                   |
| `npm run lint:fix`     | Run ESLint with auto-fix     |
| `npm run format`       | Format code with Prettier    |
| `npm run format:check` | Check formatting             |
| `npm run type-check`   | Run TypeScript type checking |
| `npm run test`         | Run tests in watch mode      |
| `npm run test:ci`      | Run tests once (CI mode)     |

#### Before Submitting a PR

1. Run the linter: `npm run lint`
2. Run the tests: `npm run test:ci`
3. Make sure the build passes: `npm run build`
4. Format your code: `npm run format`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `chore:` maintenance tasks
- `refactor:` code refactoring
- `test:` adding or updating tests
- `style:` formatting changes (no code logic)

Example: `feat: add card duplication button`

### Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes and commit
3. Push to your fork: `git push origin feat/my-feature`
4. Open a Pull Request against `main`
5. Fill in the PR template
6. Wait for CI checks to pass and code review

### Reporting Bugs

Use the [Bug Report template](https://github.com/chichekebbab/cardgenerator/issues/new?template=bug_report.md) and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information

### Requesting Features

Use the [Feature Request template](https://github.com/chichekebbab/cardgenerator/issues/new?template=feature_request.md).

---

## Français

Merci de votre intérêt pour contribuer au Générateur de Cartes Munchkin !

### Démarrage

1. **Forkez** le repository
2. **Clonez** votre fork :
   ```bash
   git clone https://github.com/VOTRE_UTILISATEUR/cardgenerator.git
   cd cardgenerator
   ```
3. **Installez les dépendances** :
   ```bash
   npm install
   ```
4. **Lancez le serveur de développement** :
   ```bash
   npm run dev
   ```

### Scripts Disponibles

| Commande           | Description                               |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Serveur de développement                  |
| `npm run build`    | Build de production                       |
| `npm run lint`     | Lancer ESLint                             |
| `npm run lint:fix` | Lancer ESLint avec correction automatique |
| `npm run format`   | Formater le code avec Prettier            |
| `npm run test`     | Lancer les tests en mode watch            |
| `npm run test:ci`  | Lancer les tests une fois (mode CI)       |

### Avant de Soumettre une PR

1. Lancez le linter : `npm run lint`
2. Lancez les tests : `npm run test:ci`
3. Vérifiez que le build passe : `npm run build`
4. Formatez votre code : `npm run format`

### Messages de Commit

Nous suivons les [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` modifications de documentation
- `chore:` tâches de maintenance
- `refactor:` refactorisation de code
- `test:` ajout ou mise à jour de tests

Exemple : `feat: add card duplication button`

### Processus de Pull Request

1. Créez une branche : `git checkout -b feat/ma-fonctionnalite`
2. Faites vos modifications et committez
3. Poussez vers votre fork : `git push origin feat/ma-fonctionnalite`
4. Ouvrez une Pull Request vers `main`
5. Remplissez le template de PR
6. Attendez que les vérifications CI passent et la review
