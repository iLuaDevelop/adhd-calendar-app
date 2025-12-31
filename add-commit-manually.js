#!/usr/bin/env node
/**
 * Add a manual commit to the What's New feed
 * Usage: node add-commit-manually.js "Your commit title" "Your commit description"
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load credentials
const credPath = path.join(__dirname, 'firebase-credentials.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addCommit() {
  const title = process.argv[2] || 'New feature added';
  const desc = process.argv[3] || 'Check the What\'s New section!';

  try {
    console.log(`📝 Adding commit: "${title}"`);

    const commit = {
      title,
      description: desc,
      type: 'commit',
      icon: '✏️',
      timestamp: Date.now(),
      active: true
    };

    const docRef = await db.collection('updates').add(commit);
    console.log(`✅ Commit added! ID: ${docRef.id}`);
    console.log(`\n📍 Check Dashboard → What's New → Latest Commits`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCommit();
