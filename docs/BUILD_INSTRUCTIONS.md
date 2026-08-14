# F.R.I.D.A.Y. Build & Execution Instructions

## Prerequisites
- **Node.js**: `v18.0.0` or higher (Tested on Node v24.11.1)
- **npm**: `v9.0.0` or higher (Tested on npm 11.6.2)
- **OS**: Windows 10/11, macOS, Android (Chrome/PWA/Capacitor), iOS (Safari/PWA/Capacitor)

---

## 1. Local Development Quickstart

### Step 1: Install Dependencies
Run from root directory:
```bash
# Backend dependencies
cd backend
npm install

# Client dependencies
cd ../client
npm install

# Desktop shell dependencies
cd ../desktop
npm install
```

### Step 2: Run Backend Core Server
```bash
cd backend
npm start
```
- Backend REST API will start on `http://localhost:3001`
- WebSocket Server will accept connections on `ws://localhost:3001`

### Step 3: Run Client Web UI
In a separate terminal:
```bash
cd client
npm run dev
```
- Client web application will open at `http://localhost:3000`

---

## 2. Desktop Shell Execution (Windows & macOS)

To run F.R.I.D.A.Y. as a native desktop app with System Tray and Global Hotkeys (`Ctrl+Shift+Space`):

```bash
cd desktop
npm start
```

### Packaging Desktop Binary
To create a standalone `.exe` (Windows) or `.dmg` / `.app` (macOS):
```bash
npx electron-builder --win --mac
```

---

## 3. Mobile Execution (Android & iOS)

F.R.I.D.A.Y. is built with a responsive mobile-first PWA architecture and Capacitor compatibility.

### Option A: Progressive Web App (PWA)
1. Deploy `client/dist` to any HTTPS web server.
2. Open URL on Android (Chrome) or iOS (Safari).
3. Select **"Add to Home Screen"**.
4. Grant Microphone permission for background voice VAD listening.

### Option B: Native Mobile Build (Capacitor)
```bash
cd client
npm run build
npx cap init FRIDAY com.friday.voice
npx cap add android
npx cap add ios
npx cap open android   # Opens Android Studio
npx cap open ios       # Opens Xcode
```

---

## 4. Running Verification Tests

To verify intent engine parsing, 7-day rolling context cleanup, and privacy purging:
```bash
cd backend
npm test
```
