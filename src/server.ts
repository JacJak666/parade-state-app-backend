import 'dotenv/config';
import { buildApp } from './app.js';
import { deleteExpiredStatuses } from './services/statusService.js';

/** Schedule a function to run at the next midnight SGT (Asia/Singapore, UTC+8), then repeat daily */
function scheduleDailyMidnightSGT(fn: () => void): void {
  function msUntilNextSGTMidnight(): number {
    const now = new Date();
    // SGT is UTC+8, so SGT midnight = 16:00 UTC
    const next = new Date();
    next.setUTCHours(16, 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  function schedule() {
    setTimeout(() => {
      fn();
      schedule();
    }, msUntilNextSGTMidnight());
  }

  schedule();
}

async function main() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3000', 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);

    // Run cleanup immediately on startup, then every day at midnight SGT
    const startupCount = await deleteExpiredStatuses();
    if (startupCount > 0) {
      console.log(`[cleanup] Deleted ${startupCount} expired status record(s) on startup`);
    }

    scheduleDailyMidnightSGT(async () => {
      const count = await deleteExpiredStatuses();
      if (count > 0) {
        console.log(`[cleanup] Deleted ${count} expired status record(s) at midnight SGT`);
      }
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
