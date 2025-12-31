#!/usr/bin/env node
/**
 * Restore essential Firestore data after accidental deletion
 * Creates sample data to get the app working again
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load credentials
const credPath = path.join(__dirname, 'firebase-credentials.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));

// Initialize with service account credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function restoreData() {
  try {
    console.log('🔄 Restoring Firestore data...\n');

    // Create sample user profile
    const userId = 'test-user-001';
    await db.collection('playerProfiles').doc(userId).set({
      username: 'ADHDGamer',
      avatar: '🎮',
      level: 5,
      xp: 2500,
      tasksCompleted: 12,
      eventsCreated: 3,
      selectedTitle: 'Organized',
      streak: 7,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Created player profile');

    // Create sample user document
    await db.collection('users').doc(userId).set({
      username: 'ADHDGamer',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Created user document');

    // Create sample tasks
    const now = new Date();
    const taskIds = [];
    
    const tasks = [
      {
        title: 'Complete project report',
        description: 'Finish the quarterly report for stakeholders',
        status: 'active',
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        estimatedTime: 120,
        priority: 'high',
        createdAt: new Date().toISOString()
      },
      {
        title: 'Review team feedback',
        description: 'Go through all feedback from the team meeting',
        status: 'completed',
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 45,
        priority: 'medium',
        createdAt: new Date().toISOString()
      },
      {
        title: 'Update documentation',
        description: 'Update API docs with new endpoints',
        status: 'active',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 90,
        priority: 'low',
        createdAt: new Date().toISOString()
      }
    ];

    for (const task of tasks) {
      const docRef = await db.collection('tasks').add({
        ...task,
        userId
      });
      taskIds.push(docRef.id);
    }
    console.log(`✅ Created ${tasks.length} sample tasks`);

    // Create sample releases for What's New
    const releases = [
      {
        title: 'Test Release Demo | Auto-posted via webhook',
        description: 'This is a test to verify the release webhook works',
        releaseTag: 'test-release-demo',
        type: 'release',
        icon: '🚀',
        timestamp: new Date().getTime(),
        active: true
      },
      {
        title: 'Version 1.0.3 - Quality of Life & Social Features',
        description: 'Major improvements including What\'s New feed, enhanced task system',
        releaseTag: 'v1.0.3',
        type: 'release',
        icon: '🚀',
        timestamp: new Date('2024-11-15').getTime(),
        active: true
      },
      {
        title: 'Version 1.0.2 - Multi-Platform Release',
        description: 'Now available on Windows, Web, iOS, and Android',
        releaseTag: 'v1.0.2',
        type: 'release',
        icon: '🚀',
        timestamp: new Date('2024-10-01').getTime(),
        active: true
      }
    ];

    for (const release of releases) {
      await db.collection('updates').add(release);
    }
    console.log(`✅ Created ${releases.length} sample releases`);

    // Create sample commits for What's New
    const commits = [
      {
        title: 'Add styled scrollbar to commits section',
        description: 'Visible scrolling to view older commits',
        type: 'commit',
        icon: '✏️',
        timestamp: new Date().getTime(),
        active: true
      },
      {
        title: 'Add release webhook',
        description: 'Auto-post GitHub releases to What\'s New with 🚀 emoji',
        type: 'commit',
        icon: '🔧',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).getTime(),
        active: true
      },
      {
        title: 'Create What\'s New system',
        description: 'Real-time feed with commits and releases',
        type: 'commit',
        icon: '✏️',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).getTime(),
        active: true
      }
    ];

    for (const commit of commits) {
      await db.collection('updates').add(commit);
    }
    console.log(`✅ Created ${commits.length} sample commits`);

    // Create sample pet data
    await db.collection('petData').doc(userId).set({
      name: 'Buddy',
      stage: 2,
      xp: 1200,
      mood: 'happy',
      items: ['🎁', '🌟'],
      createdAt: new Date().toISOString()
    });
    console.log('✅ Created sample pet');

    // Create leaderboard entry
    await db.collection('leaderboard').doc(userId).set({
      username: 'ADHDGamer',
      xp: 5200,
      rank: 42,
      tasksCompleted: 12,
      lastUpdated: new Date().toISOString()
    });
    console.log('✅ Created leaderboard entry');

    console.log('\n✨ Restoration complete!');
    console.log('\nSample data created:');
    console.log('  • User profile: ADHDGamer (Level 5)');
    console.log('  • Tasks: 3 (1 completed, 2 active)');
    console.log('  • What\'s New: 3 releases + 3 commits');
    console.log('  • Pet: Buddy (Stage 2)');
    console.log('  • Leaderboard: 1 entry\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during restoration:', error.message);
    process.exit(1);
  }
}

restoreData();
