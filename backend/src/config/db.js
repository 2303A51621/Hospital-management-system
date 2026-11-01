const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const normalizeUri = (uri) => (uri ? uri.trim() : '');

const getLocalMongoUri = () => {
  return normalizeUri(process.env.LOCAL_MONGODB_URI) || 'mongodb://localhost:27017/kushal_hospitals';
};

const getAtlasMongoUri = () => {
  return (
    normalizeUri(process.env.MONGODB_URI) ||
    normalizeUri(process.env.MONGO_URI) ||
    normalizeUri(process.env.MONGODB_ATLAS_URI) ||
    getLocalMongoUri()
  );
};

const connectDB = async (uri = getAtlasMongoUri()) => {
  if (!uri) {
    throw new Error('No MongoDB connection URI configured.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
    });
  } catch (error) {
    const localUri = getLocalMongoUri();
    const canUseLocalFallback =
      process.env.NODE_ENV === 'development' &&
      process.env.FALLBACK_LOCAL_MONGODB !== 'false' &&
      uri !== localUri;

    if (!canUseLocalFallback) {
      throw error;
    }

    console.error(`MongoDB Atlas connection failed: ${error.message}`);
    console.error(`Falling back to local MongoDB for development: ${localUri}`);
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: false,
    });
    uri = localUri;
  }

  const maskedUri = uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@');
  console.log(`MongoDB connected: ${maskedUri}`);

  return mongoose.connection;
};

const getDatabaseNameFromUri = (uri) => {
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname.replace('/', '').split('?')[0];
    return dbName || 'kushal_hospitals';
  } catch {
    return 'kushal_hospitals';
  }
};

const resolveMongoBin = (binaryName) => {
  const candidates = [
    `C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\${binaryName}.exe`,
    `C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\${binaryName}.exe`,
    `C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\${binaryName}.exe`,
    `C:\\Program Files\\MongoDB\\Server\\5.0\\bin\\${binaryName}.exe`,
    `${binaryName}`,
  ];

  for (const candidate of candidates) {
    if (candidate === binaryName) {
      try {
        const { execSync } = require('node:child_process');
        execSync(`where ${binaryName}`, { stdio: 'ignore' });
        return binaryName;
      } catch {
        return binaryName;
      }
    }

    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (error) {
      // ignore
    }
  }

  return binaryName;
};

const syncLocalDataToAtlas = async () => {
  const localUri = getLocalMongoUri();
  const atlasUri = getAtlasMongoUri();

  if (localUri === atlasUri) {
    console.log('Local MongoDB URI matches Atlas URI. No migration needed.');
    return { skipped: true, message: 'Local and Atlas URIs are the same.' };
  }

  const { execFileSync } = require('node:child_process');
  const dumpDir = path.resolve(__dirname, '../../.mongo-dump');

  try {
    fs.rmSync(dumpDir, { recursive: true, force: true });

    const mongodumpPath = resolveMongoBin('mongodump');
    const mongorestorePath = resolveMongoBin('mongorestore');

    console.log('Dumping local MongoDB data...');
    execFileSync(mongodumpPath, ['--uri', localUri, '--out', dumpDir], { stdio: 'inherit' });

    const localDbName = getDatabaseNameFromUri(localUri);
    const sourceFolder = path.join(dumpDir, localDbName);

    if (!fs.existsSync(sourceFolder)) {
      throw new Error(`Local dump folder not found: ${sourceFolder}`);
    }

    console.log('Restoring data to Atlas cluster...');
    execFileSync(mongorestorePath, ['--uri', atlasUri, '--drop', sourceFolder], { stdio: 'inherit' });

    console.log('Local MongoDB data copied to Atlas cluster successfully.');
    return { skipped: false, source: localUri, target: atlasUri };
  } catch (error) {
    const message = error?.message ?? String(error);
    console.error('Local-to-Atlas migration failed.');
    console.error('Try using the full MongoDB bin path if needed.');
    console.error(message);
    throw error;
  }
};

module.exports = {
  connectDB,
  getAtlasMongoUri,
  getLocalMongoUri,
  syncLocalDataToAtlas,
  mongoose,
};
