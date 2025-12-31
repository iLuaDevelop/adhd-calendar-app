const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase with explicit file path
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ firebase-credentials.json not found at', credentialsPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
} catch (err) {
  // App already initialized
  if (!err.message.includes('already')) {
    throw err;
  }
}

const db = admin.firestore();

// Collections to export
const COLLECTIONS = [
  'playerProfiles',
  'gameProgress',
  'updates',
  'leaderboard',
  'tasks',
  'events',
  'quests',
  'achievements',
  'userSettings',
];

async function exportDatabase() {
  try {
    console.log('🔄 Starting full database export (admin)...');
    console.log('   Project:', serviceAccount.project_id);
    
    const backup = {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const collectionName of COLLECTIONS) {
      try {
        console.log(`  📦 Exporting ${collectionName}...`);
        const snapshot = await db.collection(collectionName).get();
        
        backup[collectionName] = [];
        snapshot.forEach(doc => {
          backup[collectionName].push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        console.log(`     ✓ ${backup[collectionName].length} documents`);
      } catch (err) {
        console.warn(`     ⚠ Collection "${collectionName}" error:`, err.message);
      }
    }
    
    // Save to file
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const fileName = `database-backup-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✨ Backup complete!`);
    console.log(`📁 Saved to: ${filePath}`);
    console.log(`💾 Size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
    
    // Count total documents
    let totalDocs = 0;
    for (const coll in backup) {
      totalDocs += backup[coll].length;
    }
    console.log(`📊 Total documents: ${totalDocs}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    process.exit(1);
  }
}

exportDatabase();
