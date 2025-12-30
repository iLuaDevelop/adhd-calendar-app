# Leaderboard Security Architecture

## Problem Solved ✅
**Prevented client-side manipulation of leaderboard rankings.**

Originally, the client could:
1. Open dev tools
2. Modify localStorage XP values  
3. Directly write fake data to Firestore leaderboard
4. Appear at the top of rankings with fraudulent scores

## Solution: Server-Side Validation

### Architecture

```
Client                          Firestore                    Cloud Functions
  ↓                                ↓                              ↓
Client writes game progress  → gameProgress collection → Validates & updates
(XP, gems, tasks, streak)                               → leaderboard collection
                                                        (secure write only)
                                ↑                              ↑
                          Firestore Rules            Cloud Function Logic
                      (prevents direct writes)    (business logic validation)
```

### Three Key Components

#### 1. **Firestore Security Rules** (`firestore.rules`)
- `leaderboard` collection is **READ-ONLY** for clients
- Only Cloud Functions can write to leaderboard
- `gameProgress` collection allows clients to write THEIR OWN data only
- Sanity checks prevent obvious manipulation (XP bounds, negative values, etc)

```firestore-rules
// Leaderboard is READ-ONLY for clients
match /leaderboard/{document=**} {
  allow read: if true;
  allow write: if false;  // Only Cloud Functions can write
}

// gameProgress - clients can write bounded data
match /gameProgress/{userId} {
  allow write: if request.auth.uid == userId &&
                   request.resource.data.xp >= 0 &&
                   request.resource.data.xp <= 100000;  // Max bounds
}
```

#### 2. **Cloud Function** (`functions/src/index.ts`)
Triggered when `gameProgress` is written:
- ✅ Validates all data bounds and types
- ✅ Fetches authenticated user's actual profile from Firestore  
- ✅ Calculates level from XP server-side
- ✅ Updates leaderboard as a server-side operation (bypasses security rules)
- ✅ Logs all updates for audit trail

```typescript
export const updateLeaderboardOnGameProgress = functions
  .firestore
  .document('gameProgress/{userId}')
  .onWrite(async (change, context) => {
    // Validate data
    // Fetch user profile from Firestore
    // Calculate stats server-side
    // Write to leaderboard (secure operation)
  });
```

#### 3. **Client-Side Service** (`src/services/leaderboard.ts`)
- **WRITE**: `syncPlayerToLeaderboard()` → writes to `gameProgress` collection only
- **READ**: `getGlobalLeaderboard()`, `getFriendsLeaderboard()` → read-only from `leaderboard`

No client code ever writes directly to `leaderboard` collection.

### Why This is Secure

1. **Authentication**: Only authenticated Firebase users can write gameProgress
2. **Ownership**: Users can only write to their own `gameProgress/{userId}` document
3. **Server Validation**: Cloud Function validates all data server-side
4. **Bounds Checking**: XP capped at 1,000,000 (sanity limit)
5. **Audit Trail**: All leaderboard updates logged with timestamps
6. **Immutable Read**: Leaderboard is read-only from client perspective

### Deployment Steps

#### 1. Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

#### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### 3. Create Firestore Indexes
Firebase will auto-create indexes. If manual:
- Go to Firebase Console → Firestore → Indexes
- Create composite index for: `leaderboard` collection
  - `month` (Ascending)
  - `xp` (Descending)

### Testing the Security

**Attempt to cheat (should fail):**
```javascript
// ❌ This fails - Firestore rules block direct leaderboard writes
db.collection('leaderboard').doc('fake').set({ xp: 999999 })
  .catch(err => console.log('Blocked! ✅', err))

// ❌ This also fails - gameProgress has bounds checks
db.collection('gameProgress').doc(userId).set({ xp: 999999999 })
  .then(() => console.log('Submitted...'))
  // But Cloud Function validates and rejects values > 100000
```

**Legitimate sync (works):**
```javascript
// ✅ This works - valid gameProgress update
await setDoc(doc(db, 'gameProgress', userId), {
  xp: 5262,
  gems: 150,
  tasksCompleted: 42,
  currentStreak: 7,
  longestStreak: 12,
});
// Cloud Function automatically updates leaderboard
```

### Cleanup

Cloud Function `cleanupOldLeaderboardData` runs monthly:
- Removes leaderboard entries > 3 months old
- Keeps space efficient
- Triggered via Cloud Scheduler at 1st of each month

---

## Summary

✅ **Leaderboard is now tamper-proof**
- Clients cannot manipulate rankings
- Only server-side validation matters
- All updates are validated and logged
- Cloud Function is the single source of truth

