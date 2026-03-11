import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type StatusType = 'MC' | 'LD' | 'EX' | 'SEND_OUT_URGENT' | 'SEND_OUT_NON_URGENT' | 'REPORTING_SICK' | 'OTHERS';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(baseDate: Date, offsetDaysMin: number, offsetDaysMax: number): Date {
  const offset = randomInt(offsetDaysMin, offsetDaysMax);
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.statusRecord.deleteMany();
  await prisma.recruit.deleteMany();

  // Generate 50 recruits across 3 platoons
  // Platoon 1: sections 1-4, beds 1-5 = 20 recruits (IDs 1101-1405)
  // Platoon 2: sections 1-4, beds 1-4 = 16 recruits (IDs 2101-2404)
  // Platoon 3: sections 1-4, beds 1-4 = 14 recruits (IDs 3101-3404) - only 14 to total 50
  const recruitIds: string[] = [];

  // Platoon 1: 20 recruits
  for (let s = 1; s <= 4; s++) {
    for (let b = 1; b <= 5; b++) {
      recruitIds.push(`1${s}${b.toString().padStart(2, '0')}`);
    }
  }

  // Platoon 2: 16 recruits
  for (let s = 1; s <= 4; s++) {
    for (let b = 1; b <= 4; b++) {
      recruitIds.push(`2${s}${b.toString().padStart(2, '0')}`);
    }
  }

  // Platoon 3: 14 recruits (sections 1-3 with 4 beds, section 4 with 2 beds)
  for (let s = 1; s <= 3; s++) {
    for (let b = 1; b <= 4; b++) {
      recruitIds.push(`3${s}${b.toString().padStart(2, '0')}`);
    }
  }
  for (let b = 1; b <= 2; b++) {
    recruitIds.push(`3${4}${b.toString().padStart(2, '0')}`);
  }

  console.log(`Creating ${recruitIds.length} recruits...`);

  for (const id of recruitIds) {
    const platoon = parseInt(id[0], 10);
    const section = parseInt(id[1], 10);
    const bed = parseInt(id.substring(2), 10);
    await prisma.recruit.create({ data: { id, platoon, section, bed } });
  }

  // Generate status records
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const statusTypes: StatusType[] = ['MC', 'LD', 'EX', 'REPORTING_SICK', 'OTHERS'];
  const mcRemarks = ['Fever', 'Stomach flu', 'Back pain', 'Headache', 'Knee injury'];
  const ldRemarks = ['Knee injury', 'Ankle sprain', 'Back strain', 'Wrist fracture'];
  const exRemarks = ['FIELD CAMP, STAY IN', 'OUTFIELD, STAY IN', 'FLEGS, STAY IN', 'ROUTE MARCH, STAY OUT', 'FIELD CAMP, STAY OUT'];
  const rsRemarks = ['headache', 'knee pain', 'fever', 'cough', 'back pain'];

  // Track MC records per recruit to avoid overlaps
  const mcRecords: Map<string, Array<{ start: Date; end: Date }>> = new Map();

  function hasMcOverlap(recruitId: string, start: Date, end: Date): boolean {
    const existing = mcRecords.get(recruitId) ?? [];
    return existing.some(r => r.start <= end && start <= r.end);
  }

  const statusEntries: Array<{
    recruitId: string;
    type: StatusType;
    startDate: Date;
    endDate: Date;
    remark: string;
  }> = [];

  // Create ~15-20 random status records
  const selectedRecruits = [...recruitIds].sort(() => Math.random() - 0.5).slice(0, 20);

  for (const recruitId of selectedRecruits) {
    const type = statusTypes[randomInt(0, statusTypes.length - 1)];
    let startDate: Date;
    let endDate: Date;
    let remark = '';

    switch (type) {
      case 'MC': {
        startDate = randomDate(today, -3, 0);
        const duration = randomInt(1, 4);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);

        if (hasMcOverlap(recruitId, startDate, endDate)) continue;

        remark = mcRemarks[randomInt(0, mcRemarks.length - 1)];
        const existing = mcRecords.get(recruitId) ?? [];
        existing.push({ start: startDate, end: endDate });
        mcRecords.set(recruitId, existing);
        break;
      }
      case 'LD': {
        startDate = randomDate(today, -14, -1);
        const duration = randomInt(3, 84);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        remark = ldRemarks[randomInt(0, ldRemarks.length - 1)];
        break;
      }
      case 'EX': {
        startDate = randomDate(today, -2, 0);
        const duration = randomInt(3, 14);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        remark = exRemarks[randomInt(0, exRemarks.length - 1)];
        break;
      }
      case 'REPORTING_SICK': {
        startDate = today;
        endDate = today;
        remark = rsRemarks[randomInt(0, rsRemarks.length - 1)];
        break;
      }
      default: {
        startDate = randomDate(today, -3, 0);
        const duration = randomInt(1, 5);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        remark = 'Misc duty';
        break;
      }
    }

    statusEntries.push({ recruitId, type, startDate, endDate, remark });
  }

  console.log(`Creating ${statusEntries.length} status records...`);

  for (const entry of statusEntries) {
    await prisma.statusRecord.create({ data: entry });
  }

  console.log('Seed complete!');
  console.log(`  Recruits: ${recruitIds.length}`);
  console.log(`  Statuses: ${statusEntries.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
