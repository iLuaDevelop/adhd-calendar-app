# Auto-Changelog Setup Guide

## Overview
Every time you push a commit with the right format, it automatically posts to the "What's New" feed on the Dashboard via GitHub Actions.

## Setup Steps

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts** tab
4. Click "Generate new private key"
5. Download the JSON file
6. Keep this file safe - DO NOT commit it to GitHub

### 2. Add Secrets to GitHub

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret" and add these three secrets:

**FIREBASE_PROJECT_ID**
- Value: Your project ID (from the JSON file: `"project_id"`)

**FIREBASE_CLIENT_EMAIL**
- Value: From the JSON file: `"client_email"`

**FIREBASE_PRIVATE_KEY**
- Value: From the JSON file: `"private_key"` (include the full string with `\n`)

### 3. Use the Commit Message Format

When you commit, use this format:

```
emoji: title - description
```

**Examples:**

```bash
# Feature
git commit -m "✨ feat: Dashboard redesign - New 3-column layout for better space utilization"

# Bug fix
git commit -m "🐛 fix: Blackjack auto-stand - Fixed issue where game wasn't standing at 21"

# Game improvement
git commit -m "🎮 improve: Mini-games - Added difficulty scaling to Pattern Memory"

# Pet feature
git commit -m "🐾 feature: Pet badges - Level circle and stage badge on compact views"
```

**Emojis to use:**
- `✨` - New feature
- `🐛` - Bug fix
- `🎨` - UI/style improvements
- `📐` - Layout changes
- `🎮` - Game changes
- `🐾` - Pet changes
- `⚡` - Performance
- `🔧` - Configuration/setup

### 4. Push and Watch

Once you push a commit:
1. Go to your GitHub repo → **Actions** tab
2. Watch the "Auto-Update Changelog" workflow run
3. Check your Dashboard → What's New section
4. The update appears within seconds!

## How It Works

1. GitHub Actions listens for `push` events on main/master branches
2. Parses your commit message in the format: `emoji: title - description`
3. Extracts emoji, title, and description
4. Uses Firebase service account to add update to Firestore
5. Dashboard listens to Firestore in real-time and displays new updates

## Special Cases

- **Chore commits** (`chore: ...`) - Automatically skipped, won't appear
- **Docs commits** (`docs: ...`) - Automatically skipped, won't appear
- **Multi-line messages** - Uses first line as title, second line as description

## Troubleshooting

If the workflow fails:
1. Check **Actions** tab → see the error
2. Verify Firebase secrets are set correctly
3. Ensure commit message follows the format
4. Check Firebase Firestore has `updates` collection created (will auto-create on first commit)

## Manual Updates (Fallback)

If automation fails, you can still manually add updates in Firebase Console:
- Go to Firestore → `updates` collection
- Add document with: `icon`, `title`, `desc`, `active: true`, `timestamp`
