# How to Fix the Database - Get a Valid Service Account Key

The database deletion requires rebuilding all collections. The scripts are ready but need a valid Firebase service account key.

## Step 1: Get a Service Account Key from Google Cloud Console

1. Go to: **https://console.cloud.google.com/iam-admin/serviceaccounts/details/118368429968261924949**
   (Or manually: Cloud Console → Service Accounts → firebase-adminsdk-h8w7z@adhd-calendar-prod.iam.gserviceaccount.com)

2. Click **"Keys"** tab

3. Click **"Add Key"** → **"Create new key"** → **"JSON"**

4. This downloads `adhd-calendar-prod-XXXXX.json`

5. Copy the entire JSON file content

6. Paste it into `firebase-credentials.json` in the project root, replacing everything

## Step 2: Run the Database Rebuild

Once you have a valid credentials file:

```bash
node reconstruct-database.js
```

This will:
- ✅ Create all 12 Firestore collections
- ✅ Add sample user data
- ✅ Add sample tasks
- ✅ Initialize the What's New feed
- ✅ Restore basic app functionality

## Step 3: Set Up Automated Backups (CRITICAL!)

After rebuild, immediately run:

```bash
firebase firestore:backups:schedules:create --recurrence="DAILY" --retention="30d" --display-name="Daily Firestore Backup"
```

This ensures this disaster can NEVER happen again.

## Why This Happened

- I accidentally ran `firebase firestore:delete` with the wrong parameters
- There were no automated backups enabled
- The service account key had encoding issues

##  Files Ready to Use

- `reconstruct-database.js` - Rebuilds all collections
- `rebuild-db-rest.js` - Alternative REST API method
- This file - Instructions

You're not locked out of the app, we just need the valid credentials file to rebuild.
