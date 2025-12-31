#!/usr/bin/env node
/**
 * Add releases to Firebase using REST API
 * This bypasses the service account auth issue
 */

const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FIREBASE_PROJECT = 'adhd-calendar-prod';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/updates`;

async function addReleasesViaREST() {
  try {
    console.log(`📦 Fetching releases from GitHub...`);

    // Fetch all releases from GitHub
    const response = await fetch(
      `https://api.github.com/repos/MNstizzy/adhd-calendar-app/releases`,
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

    // Get ID token for Firebase
    console.log('⚠️  Note: This script requires Firebase authentication.');
    console.log('Run "firebase login" first, then use: firebase functions:config:get > .runtimeconfig.json');
    console.log('\nFor now, releases will be logged:');

    for (const release of releases) {
      const description = release.body ? release.body.substring(0, 200) : '';
      const releaseData = {
        title: release.name,
        description,
        releaseTag: release.tag_name,
        type: 'release',
        icon: '🚀',
        timestamp: new Date(release.published_at).getTime()
      };

      console.log(`\n📝 Release: ${release.tag_name}`);
      console.log(`   Title: ${release.name}`);
      console.log(`   Description: ${description.substring(0, 50)}...`);
      console.log(`   Would add to Firebase`);
    }

    console.log('\n💡 To actually add these to Firebase:');
    console.log('1. Use Firebase Console UI to add manually');
    console.log('2. Or create a new GitHub release (webhook will auto-add it)');
    console.log('3. Or get a valid service account key from Firebase Console');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addReleasesViaREST();
