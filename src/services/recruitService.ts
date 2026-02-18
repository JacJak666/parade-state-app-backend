import { prisma } from '../lib/prisma.js';
import { parseRecruitId } from '../utils/recruitId.js';
import type { Recruit } from '../types/index.js';

export async function addRecruit(id: string): Promise<Recruit> {
  const { platoon, section, bed } = parseRecruitId(id);

  const existing = await prisma.recruit.findUnique({ where: { id } });
  if (existing) {
    throw new Error(`Recruit "${id}" already exists`);
  }

  return prisma.recruit.create({
    data: { id, platoon, section, bed },
  });
}

export async function getAllRecruits(): Promise<Recruit[]> {
  return prisma.recruit.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function getRecruitById(id: string): Promise<Recruit> {
  const recruit = await prisma.recruit.findUnique({ where: { id } });
  if (!recruit) {
    throw new Error(`Recruit "${id}" not found`);
  }
  return recruit;
}

export async function deleteRecruit(id: string): Promise<void> {
  const existing = await prisma.recruit.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Recruit "${id}" not found`);
  }
  await prisma.recruit.delete({ where: { id } });
}
