import type { FastifyPluginAsync } from 'fastify';
import { generateParadeState, getAvailablePlatoons } from '../services/paradeStateService.js';
import { formatParadeState } from '../services/formatService.js';
import { normalizeToDate } from '../utils/dateUtils.js';

const paradeStateRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /parade-state/platoons — returns the list of platoon numbers that exist
  fastify.get('/parade-state/platoons', async () => {
    const platoons = await getAvailablePlatoons();
    return { success: true, data: platoons };
  });

  // GET /parade-state?date=YYYY-MM-DD&platoon=1,2,3
  fastify.get<{ Querystring: { date?: string; platoon?: string } }>('/parade-state', async (request) => {
    const date = request.query.date ? normalizeToDate(request.query.date) : undefined;

    // Parse comma-separated platoon numbers, e.g. "1,3" → [1, 3]
    const platoonFilter = request.query.platoon
      ? request.query.platoon
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n))
      : undefined;

    const structuredData = await generateParadeState(date, platoonFilter);
    const formattedText = formatParadeState(structuredData);
    return { success: true, data: { structuredData, formattedText } };
  });
};

export default paradeStateRoutes;
