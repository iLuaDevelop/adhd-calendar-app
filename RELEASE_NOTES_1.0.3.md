# Version 1.0.3 - Quality of Life & Social Features

🎉 **ADHD Calendar v1.0.3** is here with major improvements to gameplay, social features, and user experience!

## ✨ New Features

### 🎮 Mini Games Suite
- Added interactive mini-games to earn XP and gems
- Accessible from quick game break card on dashboard
- Variety of casual games to take mental breaks

### 👥 Enhanced Social System
- **Reworked Friend Statistics** - Friend profiles now properly display earned medals, titles, and stats
- **Secure Leaderboard System** - Implemented server-side leaderboard validation with Firestore security rules
- **Improved Profile Display** - Relocated profile card to top-right header for cleaner dashboard layout
- **Custom Avatar Support** - Player avatars now display properly with custom images and fallback emojis

### 🏆 Title System Improvements
- Titles now sync properly across sessions
- Gradient-styled title display in profile header
- Fixed title selection and persistence

## 🐛 Bug Fixes & Improvements

### Pet System
- Fixed pet level scaling to match XP progression correctly
- Improved pet hunger and happiness mechanics

### Tasks & Quests
- **Reworked Task Timer** - Improved focus timer logic for better accuracy
- **Task Counter Fixes** - Adjusted task completion counting to prevent duplicates
- **Delete Confirmation** - Added safety modal before permanently deleting tasks
- **Quest Menu** - Enhanced quest sidebar with better visual organization

### UI/UX Overhaul
- Replaced native browser alerts with elegant toast notifications
- Custom title bar for better Windows integration
- Improved mobile responsiveness

### Account & Security
- Fixed new account initialization bugs
- Improved Firestore permission validation
- Fixed leaderboard score manipulation vulnerability

### Language Support
- Foundation laid for multi-language support (EN, FR, ES)
- Ready for international expansion in future releases

## 📊 Backend Improvements

- Server-side leaderboard rank calculations
- Improved Firebase sync reliability
- Better error handling and logging

## 📥 Installation

**Windows:**
- Installer: Download `ADHD Calendar Setup 1.0.3.exe`
- Portable: Download `ADHD Calendar 1.0.3.exe`

**Android:** Download `app-debug.apk` and install on device

## 🔧 Technical

- React 18 + TypeScript
- Electron 13.6.9
- Capacitor 5.x
- Firebase backend with enhanced security rules
- Full offline support

## ⚠️ Known Issues

- Language switching UI not yet visible (backend ready)
- Android emulator may require specific drivers
- Recommended: Test on physical Android device

---

**Release Date:** December 25, 2025
**Tested on:** Windows 10/11, Android 12+
