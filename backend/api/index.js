const { app } = require('../server');
const { connectDB } = require('../src/config/db');

let connectionPromise;

module.exports = async (req, res) => {
  try {
    connectionPromise = connectionPromise || connectDB();
    await connectionPromise;
    return app(req, res);
  } catch (error) {
    console.error('Serverless API startup failed:', error);
    res.statusCode = 500;
    return res.json({ success: false, message: 'Database connection failed' });
  }
};
