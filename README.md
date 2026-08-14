# Project Secretary — F.R.I.D.A.Y. AI Digital Secretary

**F.R.I.D.A.Y.** (*Female Replacement Intelligent Digital Assistant Youth*) is a cross-platform tactical AI digital secretary and voice assistant engineered for high-performance personal and executive productivity.

---

## 🌟 Key Features

- **Tactical Arc Reactor HUD**: High-fidelity dark mode reactive HUD with HTML5 audio visualizer and real-time speech telemetry.
- **Voice Studio & HD Audio Engine**: Multi-provider voice synthesis supporting ElevenLabs (`eleven_multilingual_v2`), Azure Neural Voice, Google Cloud TTS, and On-Device offline synthesis.
- **Natural Human Prosody**: Tuned stability (`0.30`), similarity boost (`0.90`), and style expressiveness (`0.55`) for human-like cadence and breathing variation.
- **Executive Google Workspace Integration**: Google Calendar conflict detection, smart time-slot finder, Gmail summarization, and draft approval workflow.
- **Ambient Meeting Intelligence Engine**: Diarized live meeting transcription, voice bookmarks, automated action item extraction, and PDF export.
- **Unified Multi-Channel Communication**: Centralized inbox across SMS, Viber, Facebook Messenger, and Gmail with smart replies and DND meeting mode.
- **Secretary Brain 2.0**: Proactive morning briefings, habit learning, relationship management, and predictive pre-meeting preparation packs.
- **Privacy First & E2E Security**: AES-256 / libsodium encrypted cross-device vector clock synchronization, 7-day rolling context cleanup, and one-click data purge.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Kylrie/Project-Secretary.git
cd Project-Secretary

# Install dependencies across all workspaces
npm install
npm --prefix backend install
npm --prefix client install
npm --prefix desktop install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```
Configure your API keys in `backend/.env` (ElevenLabs API key, Google OAuth credentials, etc.).

### 4. Run Development Servers
```bash
# Start both Backend Core & Vite Client
npm run dev

# Or launch the Native Electron Desktop App
npm run app
```

- **Frontend HUD**: `http://localhost:5173`
- **Backend Core**: `http://localhost:3001`
- **WebSocket Channel**: `ws://localhost:3001`

---

## 🧪 Testing Suite

Run all automated unit and integration test suites:
```bash
cd backend
npm test
```
All 38 test suites across all 5 architecture phases pass 100%.

---

## 📄 License
MIT License. Created by Kylrie.
