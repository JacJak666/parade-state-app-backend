import type { FastifyPluginAsync } from 'fastify';
import { addStatus, getActiveStatuses, deleteStatus } from '../services/statusService.js';
import { normalizeToDate } from '../utils/dateUtils.js';
import type { CreateStatusInput } from '../types/index.js';

const statusRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /status
  fastify.post<{ Body: CreateStatusInput }>('/status', async (request, reply) => {
    const { recruitId, type, startDate, endDate, remark } = request.body ?? {} as any;

    if (!recruitId || !type || !startDate || !endDate) {
      return reply.code(400).send({
        success: false,
        error: 'recruitId, type, startDate, and endDate are required',
      });
    }

    try {
      const status = await addStatus({ recruitId, type, startDate, endDate, remark });
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
  fastify.get<{ Querystring: { date?: string } }>('/status/active', async (request) => {
    const date = request.query.date ? normalizeToDate(request.query.date) : undefined;
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
