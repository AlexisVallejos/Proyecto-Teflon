import cron from 'node-cron';
import { runConsortiumDailyNotifications } from './consortiumService.js';

let task = null;

export function startConsortiumCron() {
  const enabled = String(process.env.ENABLE_CONSORTIUM_CRON || '').trim().toLowerCase();
  if (!['1', 'true', 'yes', 'on'].includes(enabled)) {
    return null;
  }

  if (task) return task;

  const schedule = String(process.env.CONSORTIUM_CRON_SCHEDULE || '15 9 * * *').trim();
  task = cron.schedule(schedule, async () => {
    try {
      const summary = await runConsortiumDailyNotifications();
      console.log('[consortium-cron] daily notifications completed', summary);
    } catch (err) {
      console.error('[consortium-cron] daily notifications failed', err?.message || err);
    }
  });

  console.log(`[consortium-cron] enabled with schedule "${schedule}"`);
  return task;
}
