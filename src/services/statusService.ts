import { prisma } from '../lib/prisma.js';
import { normalizeToSGTDate, formatDateToDDMMYY } from '../utils/dateUtils.js';
import type { StatusRecord, CreateStatusInput, StatusType } from '../types/index.js';

// MC, SEND_OUT_URGENT, SEND_OUT_NON_URGENT are mutually exclusive with each other.
// All types are also mutually exclusive with themselves (same-type overlap).
function getConflictTypes(type: StatusType): StatusType[] {
  const mutualExclusionGroup: StatusType[] = ['MC', 'SEND_OUT_URGENT', 'SEND_OUT_NON_URGENT'];
  if (mutualExclusionGroup.includes(type)) {
    return mutualExclusionGroup;
  }
  return [type];
}

export async function addStatus(input: CreateStatusInput): Promise<StatusRecord> {
  const { recruitId, type, startDate: startStr, endDate: endStr, remark, outOfCamp } = input;

  // Validate recruit exists
  const recruit = await prisma.recruit.findUnique({ where: { id: recruitId } });
  if (!recruit) {
    throw new Error(`Recruit "${recruitId}" not found`);
  }

  const startDate = normalizeToSGTDate(startStr);
  const endDate = normalizeToSGTDate(endStr);

  // Validate date range
  if (endDate < startDate) {
    throw new Error('endDate must be on or after startDate');
  }

  // Overlap / mutual-exclusion check
  const conflictTypes = getConflictTypes(type);
  const overlapping = await prisma.statusRecord.findFirst({
    where: {
      recruitId,
      type: { in: conflictTypes },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (overlapping) {
    const isCrossType = overlapping.type !== type;
    const msg = isCrossType
      ? `overlap: recruit ${recruitId} already has ${overlapping.type} from ${formatDateToDDMMYY(overlapping.startDate)} to ${formatDateToDDMMYY(overlapping.endDate)} (conflicts with ${type})`
      : `overlap: recruit ${recruitId} already has ${type} from ${formatDateToDDMMYY(overlapping.startDate)} to ${formatDateToDDMMYY(overlapping.endDate)}`;
    throw new Error(msg);
  }

  return prisma.statusRecord.create({
    data: {
      recruitId,
      type,
      startDate,
      endDate,
      remark: remark ?? '',
      outOfCamp: type === 'OTHERS' ? (outOfCamp ?? false) : false,
    },
  });
}

export async function getActiveStatuses(date?: Date): Promise<StatusRecord[]> {
  const targetDate = date ? normalizeToSGTDate(date) : normalizeToSGTDate(new Date());

  return prisma.statusRecord.findMany({
    where: {
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
    orderBy: { recruitId: 'asc' },
  });
}

export async function deleteStatus(id: string): Promise<void> {
  const existing = await prisma.statusRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Status record "${id}" not found`);
  }
  await prisma.statusRecord.delete({ where: { id } });
}

/**
 * Delete all status records whose endDate is before today (midnight SGT).
 * A status ending on 18 Feb is active on 18 Feb; it is deleted when today becomes 19 Feb.
 */
export async function deleteExpiredStatuses(): Promise<number> {
  const today = normalizeToSGTDate(new Date());
  const result = await prisma.statusRecord.deleteMany({
    where: { endDate: { lt: today } },
  });
  return result.count;
}
