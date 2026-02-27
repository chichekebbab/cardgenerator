# 🎴 Munchkin Card Generator

> 🌐 [Lire en français](README.fr.md)

**Create custom Munchkin cards with AI-generated artwork.** Design, edit, and export your own cards for the beloved board game.

### **[🎮 Try it live → niveau10.ovh](https://niveau10.ovh)**

[![CI](https://github.com/chichekebbab/cardgenerator/actions/workflows/ci.yml/badge.svg)](https://github.com/chichekebbab/cardgenerator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

---

## Screenshots

<!-- TODO: Add screenshots of the editor, a generated card, and the gallery view -->
<!-- Example: ![Editor](docs/screenshots/editor.png) -->

_Screenshots coming soon — or [try the live demo](https://niveau10.ovh)!_

---

## ✨ Features

- 🎨 **AI Image Generation** — Google Gemini creates unique card artwork
- ✂️ **Background Removal** — Remove.bg integration for clean card images
- 🃏 **Multiple Card Types** — Monsters, Treasures, Curses, Dungeon Bonuses, and more
- 🖼️ **Custom Layouts** — Upload and use your own custom card layouts
- 📊 **Deck Management** — Organize cards by category, track your progress
- 💾 **Import/Export** — CSV/JSON import, optimized batch PNG export, and BAT (Board A4 Tiled) PDF export
- 🎯 **Live Preview & Demo** — See your changes as you type, and preview global settings on a live demo card
- 🌍 **Multilingual** — Full support for English and French, covering both the user interface and card content
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

```bash
git clone https://github.com/chichekebbab/cardgenerator.git
cd cardgenerator
npm install
npm run dev
```

Open `http://localhost:5173` — that's it!

### API Keys (optional)

The app works without any API keys. To enable AI features:

1. Click the **⚙️ Settings** gear icon in the app
2. Add your keys:
   - **[Google Gemini API](https://aistudio.google.com/app/apikey)** — for AI image generation
   - **[Remove.bg API](https://www.remove.bg/api)** — for background removal
3. Keys are stored locally in your browser — never sent to our servers

---

## 🛠️ Tech Stack

|              |                             |
| ------------ | --------------------------- |
| **Frontend** | React 19 + TypeScript       |
| **Build**    | Vite 6                      |
| **Styling**  | Tailwind CSS                |
| **AI**       | Google Gemini API           |
| **Export**   | html-to-image, JSZip, jsPDF |

---

## 📁 Project Structure

```
cardgenerator/
├── components/          # React components
├── services/            # API services (Gemini, Remove.bg, Sheets)
├── utils/               # Utilities & config
├── tests/               # Unit tests (Vitest)
├── public/              # Card layouts & textures
├── App.tsx              # Main component
├── types.ts             # TypeScript interfaces
└── .github/             # CI/CD & issue templates
```

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
npm run dev          # Dev server
npm run lint         # Lint check
npm run test:ci      # Run tests
npm run build        # Production build
```

---

## ⚠️ Disclaimer

This is an **unofficial fan-made tool**. Munchkin is a trademark of Steve Jackson Games. This project is not affiliated with, endorsed by, or sponsored by Steve Jackson Games.

## 📄 License

[MIT](LICENSE) — do whatever you want with it.
