import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Calculate clock drift between local system and the internet to prevent Cloudinary "Stale request" errors
let clockOffset = 0;

async function syncClockOffset() {
  const urls = ['https://api.cloudinary.com', 'https://www.google.com'];
  for (const url of urls) {
    try {
      const start = Date.now();
      const dateStr = await new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
          resolve(res.headers.date);
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        req.end();
      });

      if (dateStr) {
        const serverTime = new Date(dateStr).getTime();
        const end = Date.now();
        const localTime = (start + end) / 2; // Middle point to adjust for network latency
        clockOffset = serverTime - localTime;
        console.log(`[Cloudinary Config] Clock synchronized using ${url}. Offset: ${clockOffset} ms (${Math.round(clockOffset / 3600000)} hours)`);
        break;
      }
    } catch (error) {
      console.warn(`[Cloudinary Config] Failed to sync clock using ${url}: ${error.message}`);
    }
  }
}

// Start synchronization in background
syncClockOffset();

// Override the SDK's timestamp function to apply the offset
cloudinary.utils.timestamp = () => {
  const adjustedTime = Date.now() + clockOffset;
  return Math.floor(adjustedTime / 1000);
};

export default cloudinary;
