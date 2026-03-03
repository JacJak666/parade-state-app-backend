import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { addStatus, getActiveStatuses, deleteStatus } from '../services/statusService.js';
import { normalizeToSGTDate } from '../utils/dateUtils.js';

const YYYY_MM_DD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const CreateStatusBody = z.object({
  recruitId: z.string().regex(/^\d{4}$/, 'recruitId must be a 4-digit number (e.g. 1101)'),
  type: z.enum(['MC', 'LD', 'EX', 'EX_STAY_IN', 'SEND_OUT_URGENT', 'SEND_OUT_NON_URGENT', 'REPORTING_SICK', 'OTHERS']),
  startDate: YYYY_MM_DD,
  endDate: YYYY_MM_DD,
  remark: z.string().optional(),
  outOfCamp: z.boolean().optional(),
});

const ActiveStatusQuery = z.object({
  date: YYYY_MM_DD.optional(),
});

const statusRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /status
  fastify.post('/status', async (request, reply) => {
    const parsed = CreateStatusBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }

    const { recruitId, type, startDate, endDate, remark, outOfCamp } = parsed.data;
    try {
      const status = await addStatus({ recruitId, type, startDate, endDate, remark, outOfCamp });
      return reply.code(201).send({ success: true, data: status });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      if (err.message.includes('overlap')) {
        return reply.code(409).send({ success: false, error: err.message });
      }
      if (err.message.includes('must be')) {
        return reply.code(400).send({ success: false, error: err.message });
      }
      throw err;
    }
  });

  // GET /status/active
  fastify.get('/status/active', async (request, reply) => {
    const parsed = ActiveStatusQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const date = parsed.data.date ? normalizeToSGTDate(parsed.data.date) : undefined;
    const statuses = await getActiveStatuses(date);
    return { success: true, data: statuses };
  });

  // DELETE /status/:id
  fastify.delete<{ Params: { id: string } }>('/status/:id', async (request, reply) => {
    try {
      await deleteStatus(request.params.id);
      return reply.code(200).send({ success: true });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      throw err;
    }
  });
};

export default statusRoutes;
