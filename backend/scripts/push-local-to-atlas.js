const { MongoClient } = require('mongodb');

const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/kushal_hospitals';
const atlasUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_ATLAS_URI ||
  'mongodb+srv://kushalmandal2006_db_user:Kushal1234@cluster0.2b610mr.mongodb.net/kushal_hospitals?retryWrites=true&w=majority&appName=Cluster0';

async function pushLocalDataToAtlas() {
  const localClient = new MongoClient(localUri, { serverSelectionTimeoutMS: 20000 });
  const atlasClient = new MongoClient(atlasUri, { serverSelectionTimeoutMS: 20000 });

  try {
    await localClient.connect();
    await atlasClient.connect();

    const localDb = localClient.db();
    const atlasDb = atlasClient.db();
    const collections = await localDb.listCollections().toArray();

    console.log(`Local collections: ${collections.map((c) => c.name).join(', ')}`);

    for (const collection of collections) {
      const localCollection = localDb.collection(collection.name);
      const atlasCollection = atlasDb.collection(collection.name);
      const documents = await localCollection.find({}).toArray();

      console.log(`Copying ${collection.name}: ${documents.length} documents`);
      await atlasCollection.deleteMany({});

      if (documents.length > 0) {
        await atlasCollection.insertMany(documents, { ordered: false });
      }

      const atlasCount = await atlasCollection.countDocuments();
      console.log(`Atlas ${collection.name}: ${atlasCount}`);
    }

    console.log('Migration complete: local MongoDB data pushed to Atlas');
  } catch (error) {
    console.error('Migration failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

pushLocalDataToAtlas();
