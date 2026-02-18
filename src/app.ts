import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import recruitRoutes from './routes/recruitRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import paradeStateRoutes from './routes/paradeStateRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors);
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/',
  });
  await app.register(recruitRoutes);
  await app.register(statusRoutes);
  await app.register(paradeStateRoutes);

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const message = error.message;

    if (error.validation) {
      return reply.code(400).send({ success: false, error: 'Validation error', details: error.validation });
    }
    if (message.includes('not found') || message.includes('Not found')) {
      return reply.code(404).send({ success: false, error: message });
    }
    if (message.includes('overlap') || message.includes('already exists')) {
      return reply.code(409).send({ success: false, error: message });
    }
    if (message.includes('Invalid recruit ID') || message.includes('must be') || message.includes('required')) {
      return reply.code(400).send({ success: false, error: message });
    }

    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal server error' });
  });

  return app;
}
