#!/usr/bin/env node
/**
 * Backfill existing GitHub releases into Firebase
 * Run: node backfill-releases.js
 * 
 * Required environment variables:
 * - GITHUB_TOKEN: GitHub personal access token
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_PRIVATE_KEY: Firebase private key
 * - FIREBASE_CLIENT_EMAIL: Firebase client email
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Firebase setup - load from credentials file
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
const serviceAccount = require(credentialsPath);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase initialized');
} catch (err) {
  console.error('❌ Firebase initialization error:', err.message);
  process.exit(1);
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

    // Fetch all releases from GitHub
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
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const releases = await response.json();
    console.log(`Found ${releases.length} releases\n`);

    let added = 0;
    let skipped = 0;

    for (const release of releases) {
      try {
        // Check if release already exists in Firebase
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

        const title = release.name || release.tag_name;
        const desc = release.body 
          ? release.body.substring(0, 200) + (release.body.length > 200 ? '...' : '')
          : '';

        const releaseData = {
          icon: '🚀',
          title: title,
          desc: desc,
          active: true,
          type: 'release',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          releaseTag: release.tag_name,
          publishedAt: new Date(release.published_at).getTime()
        };

        await db.collection('updates').add(releaseData);
        console.log(`✅ Added: ${title}`);
        added++;
      } catch (error) {
        console.error(`❌ Error adding ${release.tag_name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${releases.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

backfillReleases();
