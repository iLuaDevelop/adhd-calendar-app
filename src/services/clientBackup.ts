import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export const clientBackupDatabase = async () => {
  try {
    console.log('🔄 Starting client-side database backup...');

    const backup: any = {};
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

    for (const collectionName of COLLECTIONS) {
      try {
        console.log(`  📦 Exporting ${collectionName}...`);
        const snapshot = await getDocs(collection(db, collectionName));

        backup[collectionName] = [];
        snapshot.forEach((doc) => {
          backup[collectionName].push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log(`     ✓ ${backup[collectionName].length} documents`);
      } catch (err) {
        console.warn(`     ⚠ Collection "${collectionName}" error, skipping...`);
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `adhd-calendar-backup-${timestamp}.json`;

    // Create blob and download
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`\n✨ Backup downloaded: ${filename}`);
    console.log(`💾 Size: ${(blob.size / 1024).toFixed(2)} KB`);

    return { success: true, filename, size: blob.size };
  } catch (error) {
    console.error('❌ Error backing up database:', error);
    throw error;
  }
};
