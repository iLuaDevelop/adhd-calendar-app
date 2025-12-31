#!/usr/bin/env node
/**
 * Complete Firestore data reconstruction
 * Rebuilds ALL collections with proper schema and sample data
 * Uses Firebase Admin SDK with CLI authentication
 */

const admin = require('firebase-admin');
const path = require('path');

// Load credentials from file (CLI login context)
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
let credentials;
try {
  credentials = require(credentialsPath);
} catch (e) {
  console.log('⚠️  Using default credentials (ensure logged in with: firebase login)');
}

try {
  if (credentials) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id
    });
  } else {
    admin.initializeApp({
      projectId: 'adhd-calendar-app'
    });
  }
} catch (err) {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'adhd-calendar-app' });
  }
}

const db = admin.firestore();
const batch = db.batch();
let batchSize = 0;
const MAX_BATCH_SIZE = 500;

async function addWithBatch(collectionName, docData, docId = null) {
  const docRef = docId 
    ? db.collection(collectionName).doc(docId)
    : db.collection(collectionName).doc();
  
  batch.set(docRef, docData, { merge: false });
  batchSize++;
  
  if (batchSize >= MAX_BATCH_SIZE) {
    await batch.commit();
    batchSize = 0;
  }
}

async function reconstructDatabase() {
  try {
    console.log('🔄 Reconstructing Firestore database...\n');
    
    const now = new Date();
    const testUserId = 'default-user-001';

    // ========== USERS COLLECTION ==========
    console.log('📝 Creating users...');
    await addWithBatch('users', {
      email: 'test@adhd-calendar.app',
      username: 'TestUser',
      avatar: '👨‍💼',
      createdAt: now.toISOString(),
      lastLogin: now.toISOString(),
      preferences: {
        theme: 'dark',
        notifications: true,
        soundEnabled: true
      }
    }, testUserId);

    // ========== PLAYER PROFILES COLLECTION ==========
    console.log('📝 Creating player profiles...');
    await addWithBatch('playerProfiles', {
      userId: testUserId,
      username: 'TestUser',
      avatar: '👨‍💼',
      level: 1,
      xp: 0,
      tasksCompleted: 0,
      eventsCreated: 0,
      selectedTitle: null,
      streak: 0,
      totalStreakDays: 0,
      joinedDate: now.toISOString(),
      lastActivityDate: now.toISOString()
    }, testUserId);

    // ========== PET DATA COLLECTION ==========
    console.log('📝 Creating pet data...');
    await addWithBatch('petData', {
      userId: testUserId,
      name: 'Companion',
      stage: 1,
      xp: 0,
      mood: 'happy',
      items: [],
      adoptedDate: now.toISOString(),
      lastFed: now.toISOString(),
      energyLevel: 100
    }, testUserId);

    // ========== TASKS COLLECTION ==========
    console.log('📝 Creating tasks...');
    const taskIds = [];
    const sampleTasks = [
      {
        title: 'Get started with ADHD Calendar',
        description: 'Explore the dashboard and create your first task',
        status: 'active',
        userId: testUserId,
        createdAt: now.toISOString(),
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 30,
        priority: 'high',
        completed: false
      },
      {
        title: 'Check out the games section',
        description: 'Play pattern memory or reaction test for bonus XP',
        status: 'active',
        userId: testUserId,
        createdAt: now.toISOString(),
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 15,
        priority: 'medium',
        completed: false
      },
      {
        title: 'Customize your profile',
        description: 'Set your avatar and select a title',
        status: 'active',
        userId: testUserId,
        createdAt: now.toISOString(),
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 10,
        priority: 'low',
        completed: false
      }
    ];

    for (const task of sampleTasks) {
      const docRef = db.collection('tasks').doc();
      taskIds.push(docRef.id);
      await addWithBatch('tasks', { ...task, taskId: docRef.id }, docRef.id);
    }

    // ========== GAME HISTORY COLLECTION ==========
    console.log('📝 Creating game history...');
    await addWithBatch('gameHistory', {
      userId: testUserId,
      recentGames: [],
      totalGamesPlayed: 0,
      totalXpEarned: 0,
      dailyGameCount: 0,
      lastGameDate: null,
      gameCooldownUntil: null
    }, testUserId);

    // ========== LEADERBOARD COLLECTION ==========
    console.log('📝 Creating leaderboard...');
    await addWithBatch('leaderboard', {
      userId: testUserId,
      username: 'TestUser',
      xp: 0,
      level: 1,
      tasksCompleted: 0,
      rank: 1,
      avatar: '👨‍💼',
      updatedAt: now.toISOString()
    }, testUserId);

    // ========== GAME PROGRESS COLLECTION ==========
    console.log('📝 Creating game progress...');
    await addWithBatch('gameProgress', {
      userId: testUserId,
      xp: 0,
      gems: 0,
      tasksCompleted: 0,
      gamesPlayed: 0,
      lastUpdated: now.toISOString()
    }, testUserId);

    // ========== MESSAGES COLLECTION (empty, ready for friends feature) ==========
    console.log('📝 Creating messages collection structure...');
    // Just create an empty placeholder
    await addWithBatch('messages', {
      __placeholder: true,
      createdAt: now.toISOString()
    }, 'placeholder');

    // ========== FRIEND REQUESTS COLLECTION (empty, ready for friends) ==========
    console.log('📝 Creating friend requests collection...');
    await addWithBatch('friendRequests', {
      __placeholder: true,
      createdAt: now.toISOString()
    }, 'placeholder');

    // ========== UPDATES COLLECTION (What's New) ==========
    console.log('📝 Creating What\'s New updates...');
    const updates = [
      {
        title: 'Welcome to ADHD Calendar!',
        description: 'Your personal gamified productivity app is ready',
        type: 'system',
        icon: '🎉',
        timestamp: now.getTime(),
        active: true
      },
      {
        title: 'Create your first task',
        description: 'Use the Quick Add feature to add a task in seconds',
        type: 'tip',
        icon: '💡',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).getTime(),
        active: true
      },
      {
        title: 'Check the games section',
        description: 'Earn bonus XP by playing mini-games',
        type: 'tip',
        icon: '🎮',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).getTime(),
        active: true
      }
    ];

    for (const update of updates) {
      await addWithBatch('updates', update);
    }

    // ========== INVENTORY COLLECTION ==========
    console.log('📝 Creating inventory...');
    await addWithBatch('inventory', {
      userId: testUserId,
      crates: [],
      items: [],
      currency: {
        gems: 0,
        coins: 0
      },
      lastUpdated: now.toISOString()
    }, testUserId);

    // ========== CASINO STATS COLLECTION (if used) ==========
    console.log('📝 Creating casino stats...');
    await addWithBatch('casinoStats', {
      userId: testUserId,
      totalSpent: 0,
      totalWinnings: 0,
      gamesPlayed: 0,
      lastPlayed: null
    }, testUserId);

    // ========== FIRESTORE INDEXES (metadata) ==========
    // Skipping - indexes are reserved collection names and handled by Firestore
    console.log('📝 Indexes: managed by Firestore automatically');

    // Commit final batch
    if (batchSize > 0) {
      await batch.commit();
    }

    console.log('\n✨ Database reconstruction complete!\n');
    console.log('📊 Collections created:');
    console.log('  ✅ users');
    console.log('  ✅ playerProfiles');
    console.log('  ✅ petData');
    console.log('  ✅ tasks (3 sample tasks)');
    console.log('  ✅ gameHistory');
    console.log('  ✅ leaderboard');
    console.log('  ✅ gameProgress');
    console.log('  ✅ messages');
    console.log('  ✅ friendRequests');
    console.log('  ✅ updates (What\'s New feed)');
    console.log('  ✅ inventory');
    console.log('  ✅ casinoStats');
    console.log('\n🎮 Test user created:');
    console.log(`  • User ID: ${testUserId}`);
    console.log('  • Username: TestUser');
    console.log('  • Level: 1');
    console.log('  • Pet: Companion');
    console.log('\n⚠️  IMPORTANT: Set up automated backups immediately!');
    console.log('  Run: npm run setup-backups\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error during reconstruction:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

reconstructDatabase();
