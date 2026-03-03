import type { FastifyPluginAsync } from 'fastify';
import { generateParadeState, getAvailablePlatoons } from '../services/paradeStateService.js';
import { formatParadeState } from '../services/formatService.js';
import { normalizeToSGTDate } from '../utils/dateUtils.js';

const paradeStateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /parade-state/platoons — returns the list of platoon numbers that exist
  fastify.get('/parade-state/platoons', async () => {
    const platoons = await getAvailablePlatoons();
    return { success: true, data: platoons };
  });

  // GET /parade-state?date=YYYY-MM-DD&platoon=1,2,3&time=HHMM
  fastify.get<{ Querystring: { date?: string; platoon?: string; time?: string } }>('/parade-state', async (request, reply) => {
    const date = request.query.date ? normalizeToSGTDate(request.query.date) : undefined;

    // Parse comma-separated platoon numbers, e.g. "1,3" → [1, 3]
    const platoonFilter = request.query.platoon
      ? request.query.platoon
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n))
      : undefined;

    // Parse optional time override: "HHMM" → { hour, minute }
    let time: { hour: number; minute: number } | undefined;
    if (request.query.time) {
      const t = request.query.time.trim();
      if (!/^\d{4}$/.test(t)) {
        return reply.code(400).send({ success: false, error: 'time must be in HHMM format (e.g. 0930)' });
      }
      const hour = parseInt(t.slice(0, 2), 10);
      const minute = parseInt(t.slice(2, 4), 10);
      if (hour > 23 || minute > 59) {
        return reply.code(400).send({ success: false, error: 'time must be a valid 24-hour time (e.g. 0930, 2130)' });
      }
      time = { hour, minute };
    }

    const structuredData = await generateParadeState(date, platoonFilter, time);
    const formattedText = formatParadeState(structuredData);
    return { success: true, data: { structuredData, formattedText } };
  });
};

export default paradeStateRoutes;
