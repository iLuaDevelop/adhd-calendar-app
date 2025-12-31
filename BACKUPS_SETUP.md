# Database Backup Instructions

## Current Status
✅ Database reconstructed successfully
❌ Automatic backups require billing enabled

## To Enable Automatic Backups

1. **Enable Billing** (Required)
   - Go: https://console.cloud.google.com/billing/enable?project=adhd-calendar-app
   - Add payment method
   - Wait 5 minutes for activation

2. **Create Backup Schedule**
   ```bash
   firebase firestore:backups:schedules:create --recurrence=DAILY --retention=30d --project=adhd-calendar-app
   ```

3. **Verify It's Set Up**
   ```bash
   firebase firestore:backups:schedules:list --project=adhd-calendar-app
   ```

## Manual Backup (Free Alternative)

If billing isn't available, manually backup via:

```bash
firebase firestore:export gs://adhd-calendar-app-backup/manual-$(date +%Y%m%d).backup --project=adhd-calendar-app
```

## Why This Matters

Without backups:
- ❌ Accidental deletion = permanent data loss (what just happened)
- ❌ No recovery options

With backups:
- ✅ Can restore from any point in last 30 days
- ✅ Peace of mind for 200+ hours of development
- ✅ Professional practice
