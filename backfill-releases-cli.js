#!/usr/bin/env node
/**
 * Backfill releases using Firebase CLI authentication context
 * Instead of service account, use the CLI's existing auth session
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase using default credentials (CLI auth context)
// This will use GOOGLE_APPLICATION_CREDENTIALS or CLI login
try {
  admin.initializeApp({
    projectId: 'adhd-calendar-prod'
  });
  console.log('✅ Firebase initialized with CLI auth context');
} catch (err) {
  console.error('❌ Firebase init error:', err.message);
  // Try with empty init for emulator or local testing
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function backfillReleases() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'MNstizzy';
  const REPO_NAME = 'adhd-calendar-app';

  if (!GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN environment variable not set');
    process.exit(1);
  }

  try {
    console.log(`📦 Fetching releases from ${REPO_OWNER}/${REPO_NAME}...`);

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const releases = await response.json();
    console.log(`Found ${releases.length} releases\n`);

    let added = 0;
    let skipped = 0;

    for (const release of releases) {
      try {
        // Check if release already exists
        const existing = await db.collection('updates')
          .where('type', '==', 'release')
          .where('releaseTag', '==', release.tag_name)
          .limit(1)
          .get();

        if (!existing.empty) {
          console.log(`⏭️  Skipped: ${release.tag_name} (already in Firebase)`);
          skipped++;
          continue;
        }

        // Add release
        const description = release.body ? release.body.substring(0, 200) : '';
        const docRef = await db.collection('updates').add({
          title: release.name || release.tag_name,
          description,
          releaseTag: release.tag_name,
          type: 'release',
          icon: '🚀',
          timestamp: new Date(release.published_at).getTime(),
          active: true
        });

        console.log(`✅ Added: ${release.tag_name} (${docRef.id})`);
        added++;
      } catch (err) {
        console.log(`❌ Error adding ${release.tag_name}: ${err.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${releases.length}`);

    process.exit(added > 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

backfillReleases();
