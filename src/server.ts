import 'dotenv/config';
import { buildApp } from './app.js';
import { deleteExpiredStatuses } from './services/statusService.js';

/** Schedule a function to run at the next midnight UTC, then every 24 hours */
function scheduleDailyMidnightUTC(fn: () => void): void {
  const now = Date.now();
  const nextMidnight = new Date();
  nextMidnight.setUTCHours(24, 0, 0, 0); // next midnight UTC
  const msUntilMidnight = nextMidnight.getTime() - now;

  setTimeout(() => {
    fn();
    setInterval(fn, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

async function main() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3000', 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);

    // Run cleanup immediately on startup, then every day at midnight UTC
    const startupCount = await deleteExpiredStatuses();
    if (startupCount > 0) {
      console.log(`[cleanup] Deleted ${startupCount} expired status record(s) on startup`);
    }

    scheduleDailyMidnightUTC(async () => {
      const count = await deleteExpiredStatuses();
      if (count > 0) {
        console.log(`[cleanup] Deleted ${count} expired status record(s) at midnight UTC`);
      }
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
