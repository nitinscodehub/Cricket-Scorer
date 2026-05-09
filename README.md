# Badmosh Scorer 🏏

**Badmosh Scorer** is a high-performance, professional-grade cricket scoring application designed for gully cricket, local tournaments, and competitive street play. Built as a High-Performance Progressive Web App (PWA), it offers a lightning-fast Android-native feel with zero installation overhead.

## 🔥 Key Features
- **Sporty Neo-Green Theme**: Designed for high visibility outdoors and a modern aesthetic.
- **Full Offline Support**: Powered by IndexedDB; your data never leaves your device.
- **Pro Scoring Engine**: Smart strike rotation, legal delivery validation, and instant Undo.
- **Tournament Mode**: Automated points table with real-time Net Run Rate (NRR) calculation.
- **Match Insights**: Detailed scorecards, Man of the Match (MOM) analytics, and PDF exports.
- **Haptic & Audio**: Satisfying vibrations and sound effects for runs, boundaries, and wickets.

## 🚀 Installation (Android/iOS)
Since this is a PWA, you can install it directly from your browser:
1. Open the app URL in **Chrome** on Android.
2. Tap the **three dots (⋮)** in the top right.
3. Select **"Add to Home screen"** or **"Install App"**.
4. The app will now appear on your home screen and work even without an internet connection!

## 🛠 Tech Stack
- **Framework**: React 18 + Vite (High-performance SPA)
- **Styling**: Tailwind CSS (Material 3 Cyber-Sporty Theme)
- **Database**: Dexie.js (Offline-first IndexedDB)
- **Animations**: Motion (Layout transitions)
- **Exports**: jsPDF & html2canvas

## 📂 Project Structure
- `src/db/`: Database schema and persistence layer.
- `src/hooks/`: Reactive scoring engine (`useScoring`).
- `src/logic/`: Cricket math and MOM calculation.
- `src/screens/`: High-fidelity mobile interfaces.
- `src/utils/`: Sound, haptics, and formatting helpers.

---
Built with ⚡ by Badmosh Developers.
