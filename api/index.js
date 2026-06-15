import { app } from '../src/app.js';
import connectDB from '../src/config/db.js';
import { validateEnv } from '../src/config/env.js';

let dbConnected = false;

const ensureInit = async () => {
  if (dbConnected) return;
  // validate environment (will throw if required vars are missing)
  validateEnv();
  await connectDB();
  dbConnected = true;
};

export default async function handler(req, res) {
  try {
    await ensureInit();
    return app(req, res);
  } catch (err) {
    console.error('Function initialization error:', err);
    res.statusCode = 500;
    res.end('Server initialization failed');
  }
}
