# Copilot Instructions for ADHD Calendar App

## Project Overview
An Electron-based ADHD management application designed to help users manage tasks, events, and gamification elements. Built with React, TypeScript, Firebase, and supports desktop (Electron) and mobile (Capacitor) platforms.

## Project Architecture

### Core Structure
```
src/
├── App.tsx                 # Main routing, context providers, layout wrapper
├── main.tsx               # React DOM entry point
├── pages/                 # Full-page views (Dashboard, DayView, WeekView, MonthView, etc.)
├── components/            # Reusable React components
│   ├── UI/               # Low-level UI components (Button, Sidebar, XPBar, etc.)
│   ├── Calendar/         # Calendar-specific components
│   ├── Task/             # Task components (TaskCard, QuickAdd, etc.)
│   ├── FocusTimer/       # Pomodoro-style timer
│   ├── Games/            # Mini-game components (PatternMemory, ReactionTest)
│   ├── CrateRewardModal/ # Loot crate system
│   ├── PaymentModal/     # Stripe/PayPal integration
│   └── DevMenu/          # Development debugging tools
├── context/               # React Context for global state
│   ├── CalendarContext.tsx    # Tasks and events state
│   ├── LanguageContext.tsx    # i18n system (EN, ES, FR)
│   ├── PreferencesContext.tsx # User settings
│   ├── ProfileModalContext.tsx # Global profile modal state
│   └── ToastContext.tsx       # Toast notifications
├── hooks/                 # Custom React hooks
├── services/              # Business logic and API integrations
├── store/                 # Redux-like state management
├── styles/                # Tailwind CSS + custom CSS
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions (date formatting, etc.)

electron/
├── main.ts       # Electron main process
└── preload.ts    # Security context bridge

api/              # Serverless functions (Firebase Cloud Functions)
functions/        # Firebase Cloud Functions source
android/          # Capacitor Android build
ios/              # Capacitor iOS build
```

### Frontend Stack
- **React 18** + TypeScript for UI and state management
- **Vite 2.9** for fast bundling
- **Tailwind CSS** for styling + custom CSS modules
- **React Router DOM** (HashRouter) for client-side routing
- **React Context API** for global state (no Redux)
- **Web Audio API** for sound effects (synth-based tone generation)

### Backend & Services
- **Firebase**: Firestore (data), Authentication, Cloud Messaging
- **Payments**: Stripe + PayPal (via `src/services/stripe.ts`)
- **Notifications**: Firebase Cloud Messaging + browser notifications
- **Languages**: Custom i18n system with 40+ translation keys per language

### Desktop & Mobile
- **Electron 13.6.9**: Desktop app wrapper for Windows
- **Capacitor 3+**: Mobile bridge for iOS/Android
- **Custom title bar**: Hidden native title bar with custom controls

## Key Workflows

### Development
```bash
npm run dev              # Start web dev server (Vite)
npm run dev-electron    # Start Electron dev build
npm run build           # Build web production
npm run build-electron  # Full Electron build (dev, no signing)
npm run build-preload   # Build preload security bridge
npm run build-main      # Build Electron main process
```

### Release Build (With Code Signing)
```bash
npm run build-electron-release  # Full Electron build with code signing for production
npm run dist                    # Alternative: build + sign + create installer
```

### Build Process
**Development Build** (`npm run build-electron`):
1. **Preload compilation**: `esbuild` → `preload.js`
2. **Main process compilation**: `esbuild` → `main.js`
3. **Frontend bundling**: Vite transforms 130+ modules
4. **Electron packaging**: `electron-builder` creates Win32 executable (no signing)
5. **Output**: `/dist/win-unpacked/ADHD Calendar.exe` (unsigned)

**Release Build** (`npm run build-electron-release` or `npm run dist`):
1. Same steps 1-3 as development
2. **Sets env variable**: `CSC_IDENTITY_AUTO_DISCOVERY=false` to skip auto-discovery (uses custom signing)
3. **Code signing**: `customSign.js` signs the executable with certificate
4. **Electron packaging**: Creates signed Win32 executable + installer
5. **Output**: `/dist/ADHD Calendar.exe` (signed) + installer in `/dist/`

**Note**: Use `build-electron-release` or `dist` for production releases. Dev builds are unsigned.

### ⚠️ GIT COMMITS: MANDATORY AFTER EVERY BUILD
**ALWAYS commit your code after running `npm run build-electron`** to prevent losing work. Git commits save your entire source code (all `.tsx`, `.ts`, `.css` files), allowing you to restore any previous version.

```bash
# After making changes and testing
npm run build-electron

# Then immediately commit
git add -A
git commit -m "feature: description of what was changed"
git log --oneline -5  # Verify commit was created
```

**Why this matters:**
- Commits = permanent snapshots of source code (NOT just `.exe` files)
- You can restore entire codebase: `git checkout [commit-id]`
- Prevents accidental loss of features/fixes (happened with v1.0.3)
- Takes 30 seconds, saves hours of re-implementing

**Good commit messages:**
- `restore: bring back v1.0.3 features - custom toast system, fix profile card`
- `fix: QuickAdd input cutoff by moving form outside scrollable container`
- `feature: add custom toast notifications to replace native alerts`
- `chore: replace all 42 alert() calls with showToast()`

## Architecture Patterns

### State Management
- **Context API**: Used for global state (calendar, language, preferences, toast)
- **Local State**: React hooks (useState) for component-level state
- **Persistence**: localStorage for daily counters (task limits, game caps, cooldowns)
- **Server State**: Firebase Firestore for user data, task history, game history

### Service Layer Pattern
All external integrations abstracted in `src/services/`:
- `firebase.ts` - Firebase initialization and auth helpers
- `auth.ts` - User authentication and profile management
- `xp.ts` - XP calculation and level progression
- `pet.ts` - Virtual pet state and progression
- `games.ts` - Mini-game logic, daily caps, cooldown management
- `leaderboard.ts` - Leaderboard data fetching
- `stripe.ts` - Payment processing
- `notifications.ts` - Notification delivery

### Component Organization
- **Pages** (`src/pages/`): Full-screen views with sidebar/header
- **UI Components** (`src/components/UI/`): Reusable, stateless UI elements
- **Feature Components** (`src/components/Task/`, etc.): Domain-specific logic
- **Custom Hooks** (`src/hooks/`): Extracted component logic

### Styling Convention
- **Primary**: Tailwind CSS utility classes
- **Custom**: CSS modules in `src/styles/`
- **Theme Variables**: CSS custom properties (`--accent`, `--bg`, `--panel`, `--text-secondary`, etc.)
- **Responsive**: Mobile-first approach with Tailwind breakpoints

## Critical Features & Implementation Details

### Task System (Recent Update)
- **Task Timing Lock**: Once created, task time cannot be edited. Display time as read-only in edit mode.
- **Done Button Lock**: Button disabled until user's set end time (dueDate) is reached. Shows countdown timer.
- **Time Validation**: Cannot set task end time within 30 minutes of now (prevents abuse).
- **XP Only on Time**: Tasks only grant XP if completed AFTER the dueDate is reached. Deletion at any time = no XP.
- **Duration Formatting**: Countdown shows human-readable format (e.g., "2h 15m" instead of "8100s")
  - Implemented in `formatDuration()` utility function
  - Scales from seconds → minutes → hours → days → weeks → months → years

### Mini-Games System (Phase 1)
- **Games Hub**: `/games` route displays available games, difficulty selector, status, history
- **Game Types**: 
  - Pattern Memory: Simon Says-style sequence game (20-50 XP based on difficulty)
  - Reaction Test: Click speed measurement (20-50 XP based on reaction time)
- **Daily Caps**: Max 5 games per day, tracked in localStorage with date-based reset
- **Cooldown**: 2-minute cooldown between games, visible countdown on UI
- **Difficulty Scaling**: 1-5 difficulty levels affect gameplay and XP multiplier
- **XP Integration**: Game XP counts toward level progression + 15% awarded to virtual pet
- **History**: Last 10 games saved to Firebase Firestore per user

### Gamification Elements
- **XP System**: Multiple sources (tasks, games, quests)
  - `addXP(amount, source)` in `xp.ts` tracks source type
  - Applies critical hit multiplier from `critical.ts`
- **Pet System**: Virtual pet gains experience from user activities
  - `awardPetXP()` in `pet.ts` grants 10-20% of earned XP
  - Pet levels up, changes appearance, mood system
- **Streaks**: Daily task completion tracking
- **Titles & Medals**: Achievement system
- **Skill Tree**: Progressive unlock system
- **Loot Crates**: Random reward containers with timers

### Task Timing & Cooldowns
- **Task Creation**: 
  - Daily creation limit (3 default, 6 with Store unlock)
  - Total task limit (varies by Store purchases)
  - 30-minute minimum window for task end time
- **Task Completion**:
  - Task completion locked until end time reached
  - Countdown timer updates every second
  - Real-time status display: "⏳ Available in 2h 15m" or "✓ Ready to complete"
  - Early deletion possible but grants 0 XP
- **Daily Resets**: Tracked with date-based localStorage keys

### Focus Management & Forms
- **QuickAdd Component**: Rapid task creation form
  - Auto-focuses input after task submission (`autoFocus` attribute)
  - Resets all state (task, due, showPicker, showTime, hour, minute) on submit
  - Prevents stale state interference between submissions
- **Date/Time Pickers**: Positioned absolutely with z-index 400 to avoid scroll clipping

### Internationalization (i18n)
- **System**: Custom `LanguageContext` with translation key objects
- **Languages**: English, Spanish, French (40+ game keys, 100+ UI keys)
- **Usage**: Import `useLanguage()` hook, access via `t('key.path')`
- **File**: All translations in `src/services/languages.ts`

### Toast Notifications (Themed)
- **Context**: `ToastContext.tsx` with push/pop toast queue
- **Types**: success, error, warning, info
- **Auto-dismiss**: Configurable duration (default 3000ms)
- **Usage**: `const { addToast } = useToast()` → `addToast('Message', 'success')`

### Audio System
- **Initialization**: AudioContext created on first user interaction (prevents browser blocking)
- **Sound Synthesis**: Web Audio API oscillator-based tones
  - Game tile sounds: 440/554/659/784 Hz
  - Success/fail tones for feedback
- **File**: `src/services/sounds.ts` with `playSound()` function

### Development Tools
- **DevMenu**: Hotkey-activated debug menu (accessible in dev builds)
- **Controls**: 
  - Task limit resets
  - Game state resets (daily caps, cooldown timers)
  - Crate timers (bypass wait times)
  - XP/level manipulation
  - Profile data inspection
- **Location**: `src/components/DevMenu/DevMenuModal.tsx`

### Global Profile Modal (NEW - v1.0.4+)
- **Context**: `ProfileModalContext.tsx` manages global state for profile modal across all pages
- **Component**: `AppProfileModal.tsx` renders complete user profile UI
- **How it works**:
  - `ProfileModalContext` provides `openProfileModal(userId, username, avatar)` and `closeProfileModal()` methods
  - `ProfileHeaderCard` in top-right corner is wrapped by `ProfileHeaderCardWrapper` in `App.tsx`
  - When clicked, calls `openProfileModal()` with current user's data
  - `AppProfileModal` only renders if `userId === currentAuthUser.uid` (prevents showing friend profiles globally)
- **Features**:
  - Avatar selector (16 emoji options)
  - Editable name/hashtag display
  - Level and XP display with real-time sync (listens to `'xp:update'` event)
  - Selected title display
  - Streak tracking
  - Stats grid (Tasks Completed, Events Created)
  - **Titles Section**: 2-column scrollable grid (max 200px height) showing 13 titles with lock/unlock status
  - **Medals Section**: 2-column scrollable grid (max 200px height) showing 10 medals with earned/locked status
  - Logout button with localStorage.clear()
  - Close button
- **XP Sync**: Subscribes to `'xp:update'` event to update level/XP in real-time as tasks are completed
- **Separation**: Friend profile modal in `SocialMenu.tsx` uses separate `profileModalOpen` local state (no conflict)
- **Files Modified**: `src/context/ProfileModalContext.tsx` (new), `src/components/UI/AppProfileModal.tsx` (new), `src/App.tsx`, `src/main.tsx`, `src/pages/Dashboard.tsx`

## Integration Points

### Firebase Configuration
- **File**: `src/services/firebase.ts`
- **Collections**: users, tasks, gameHistory, leaderboard, etc.
- **Security**: Rules in `/firestore.rules`
- **Auth**: Firebase Authentication (email/password + social sign-in ready)

### Payment Processing
- **Stripe**: `src/services/stripe.ts` + `api/create-payment-intent.ts`
- **PayPal**: `src/services/payment.ts` (legacy)
- **Store**: In-app purchase system for task limits, game unlocks, cosmetics

### Notifications
- **Firebase Cloud Messaging**: `src/services/messaging.ts`
- **Browser Notifications**: Native browser API
- **Sent on**: Task reminders, game rewards, achievements, etc.

### Electron & Desktop
- **Main Process**: `electron/main.ts` - window management, shortcuts
- **Preload**: `electron/preload.ts` - IPC security bridge
- **Custom Title Bar**: Hidden default, custom traffic light controls
- **Code Signing**: Configured via `customSign.js` for Windows

## Common Patterns & Best Practices

### Adding a New Feature
1. **Create service** in `src/services/` if it involves external API/data logic
2. **Create context** in `src/context/` if it needs global state
3. **Create components** in `src/components/` organized by feature
4. **Create page** in `src/pages/` if it's a new route
5. **Add route** to `App.tsx` with `<Route path="/feature">`
6. **Add translations** to `src/services/languages.ts` for all UI text

### Updating Task/Event Handling
- All task mutations go through `useCalendar()` context
- Call `updateTask()`, `addTask()`, or `removeTask()` 
- Firebase persistence happens automatically in context
- Update streak and profile stats after task completion

### Creating UI Components
- Place in appropriate subfolder: `src/components/UI/`, `src/components/Task/`, etc.
- Use Tailwind for spacing/sizing, custom CSS for complex styles
- Export as default or named export (prefer default)
- Implement proper TypeScript interfaces for props

### Working with Time/Duration
- Store dates as ISO strings in database (`toISOString()`)
- Use `new Date(dateString)` for parsing
- Use `formatDuration()` from `src/utils/date.ts` for user display (not raw milliseconds)
- Always validate 30-minute minimum for task end times

### Error Handling
- Wrap async operations in try-catch
- Use `useToast()` for user-facing errors (not browser alerts)
- Log to console for debugging
- Gracefully handle Firebase auth errors (redirect to login)

## File Organization Examples

### To understand task flow:
1. Read `src/pages/Dashboard.tsx` - task list rendering
2. Check `src/components/Task/TaskCard.tsx` - individual task display
3. Look at `src/components/Task/QuickAdd.tsx` - task creation form
4. Review `src/context/CalendarContext.tsx` - task state management

### To understand game flow:
1. Start at `src/pages/MiniGames.tsx` - games hub
2. Review `src/components/Games/PatternMemory.tsx` - one game implementation
3. Check `src/services/games.ts` - game logic and daily cap system
4. Look at `src/pages/Dashboard.tsx` - quick games card integration

### To use the global profile modal:
1. Import `useProfileModal` from `src/context/ProfileModalContext.tsx`
2. Call `openProfileModal(userId, username, avatar)` to open the modal
3. The modal automatically renders at App level via `AppProfileModal` component
4. For friend profiles in `SocialMenu`, use local `profileModalOpen` state (keep separate)
5. Profile data is persisted via Firebase; XP/level sync via `'xp:update'` event

### To add a new translation:
1. Open `src/services/languages.ts`
2. Find the relevant section (e.g., `games`, `dashboard`)
3. Add new key in EN object, then ES, then FR
4. Import `useLanguage()` hook in your component
5. Use `t('section.key')` to access the translation

## Debugging Tips
- **Dev Tools**: Press hotkey (F12 equivalent) to open DevMenu in development
- **localStorage**: Check browser DevTools → Application → Local Storage
- **Firebase**: Check Firestore console for data persistence
- **State**: Add `console.log()` in useEffect hooks to trace state changes
- **Build**: Check `dist/` folder to verify bundled output
- **Electron**: Check main process logs in console for IPC/window errors

---

For implementation examples and more details, see [README.md](../README.md) and individual service files in `src/services/`.
