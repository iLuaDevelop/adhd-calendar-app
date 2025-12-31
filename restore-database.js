const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const serviceAccount = require('./firebase-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function restoreDatabase(backupFilePath) {
  try {
    // Read backup file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }
    
    console.log('🔄 Starting database restore...');
    const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    for (const collectionName in backup) {
      const docs = backup[collectionName];
      console.log(`  📦 Restoring ${collectionName}...`);
      
      for (const docData of docs) {
        const docId = docData.id;
        const data = { ...docData };
        delete data.id; // Remove id field, use it as document ID
        
        await db.collection(collectionName).doc(docId).set(data, { merge: true });
      }
      
      console.log(`     ✓ ${docs.length} documents restored`);
    }
    
    console.log(`\n✨ Restore complete!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    process.exit(1);
  }
}

// Get backup file from command line argument or list available backups
const args = process.argv.slice(2);

if (args.length === 0) {
  // List available backups
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ No backups directory found');
    process.exit(1);
  }
  
  const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  
  if (backups.length === 0) {
    console.error('❌ No backup files found in backups/ directory');
    process.exit(1);
  }
  
  console.log('📋 Available backups:');
  backups.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${file} (${size} KB)`);
  });
  
  console.log('\n📝 Usage: node restore-database.js <backup-filename>');
  console.log('   Example: node restore-database.js database-backup-2025-12-31T06-12-32-000Z.json');
  process.exit(0);
} else {
  const backupFilePath = path.join(__dirname, 'backups', args[0]);
  restoreDatabase(backupFilePath);
}
