const { syncLocalDataToAtlas } = require('../src/config/db');

(async () => {
  try {
    console.log('Starting local-to-Atlas migration...');
    const result = await syncLocalDataToAtlas();
    console.log('Migration result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message || error);
    process.exit(1);
  }
})();
