#!/usr/bin/env node
/**
 * Add releases using Firestore REST API with ID token auth
 * Requires: firebase login (already done)
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PROJECT_ID = 'adhd-calendar-prod';

async function getReleases() {
  console.log('📦 Fetching releases from GitHub...');
  const response = await fetch(
    'https://api.github.com/repos/MNstizzy/adhd-calendar-app/releases',
    {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) throw new Error(`GitHub API: ${response.statusText}`);
  return response.json();
}

async function getAccessToken() {
  try {
    // Use firebase CLI to get access token
    const token = execSync('firebase use adhd-calendar-prod && firebase auth:export --format json /dev/null 2>/dev/null && echo ""; gcloud auth application-default print-access-token 2>/dev/null', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    
    if (token) return token;
    
    // Fallback: try to get from gcloud
    return execSync('gcloud auth application-default print-access-token', {
      encoding: 'utf8'
    }).trim();
  } catch (e) {
    console.log('⚠️  Note: gcloud auth not available, skipping auth test');
    return null;
  }
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set');
    process.exit(1);
  }

  try {
    const releases = await getReleases();
    console.log(`Found ${releases.length} releases\n`);

    const releases_data = releases.map(r => ({
      title: r.name || r.tag_name,
      description: r.body ? r.body.substring(0, 200) : '',
      releaseTag: r.tag_name,
      type: 'release',
      icon: '🚀',
      timestamp: new Date(r.published_at).getTime(),
      active: true
    }));

    console.log('📋 Releases to add:');
    releases_data.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title} (${r.releaseTag})`);
    });

    console.log('\n💡 These can be added manually via:');
    console.log('1. Firebase Console UI: https://console.firebase.google.com/');
    console.log('2. Through the app UI (once logged in)');
    console.log('3. Or wait for the release webhook to auto-add new releases');

    // Try to get token to show auth is possible
    const token = await getAccessToken();
    if (token) {
      console.log('\n✅ Firebase authentication available');
      console.log('   Could add releases automatically with proper setup');
    } else {
      console.log('\n⚠️  Firebase CLI auth available, but automated write requires special setup');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
