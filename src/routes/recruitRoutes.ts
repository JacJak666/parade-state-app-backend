import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { addRecruit, getAllRecruits, getRecruitById, deleteRecruit } from '../services/recruitService.js';

const CreateRecruitBody = z.object({
  id: z.string().regex(/^\d{4}$/, 'id must be a 4-digit number (e.g. 1101)'),
});

const recruitRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /recruits
  fastify.post('/recruits', async (request, reply) => {
    const parsed = CreateRecruitBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    try {
      const recruit = await addRecruit(parsed.data.id);
      return reply.code(201).send({ success: true, data: recruit });
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return reply.code(409).send({ success: false, error: err.message });
      }
      if (err.message.includes('Invalid recruit ID')) {
        return reply.code(400).send({ success: false, error: err.message });
      }
      throw err;
    }
  });

  // GET /recruits
  fastify.get('/recruits', async () => {
    const recruits = await getAllRecruits();
    return { success: true, data: recruits };
  });

  // GET /recruits/:id
  fastify.get<{ Params: { id: string } }>('/recruits/:id', async (request, reply) => {
    try {
      const recruit = await getRecruitById(request.params.id);
      return { success: true, data: recruit };
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      throw err;
    }
  });
  // DELETE /recruits/:id
  fastify.delete<{ Params: { id: string } }>('/recruits/:id', async (request, reply) => {
    try {
      await deleteRecruit(request.params.id);
      return reply.code(200).send({ success: true });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({ success: false, error: err.message });
      }
      throw err;
    }
  });
};

export default recruitRoutes;
