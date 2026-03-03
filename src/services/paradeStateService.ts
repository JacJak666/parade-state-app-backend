import { prisma } from '../lib/prisma.js';
import { normalizeToSGTDate, isExStayInInCamp } from '../utils/dateUtils.js';
import type { StatusRecord, Recruit, StatusEntry, PlatoonParadeState, ParadeStateResult } from '../types/index.js';

/** Determine if a status record means the recruit is out of camp */
function isOutOfCamp(status: StatusRecord, exStayInInCamp: boolean): boolean {
  switch (status.type) {
    case 'MC':
    case 'SEND_OUT_URGENT':
    case 'SEND_OUT_NON_URGENT':
      return true;
    case 'EX':
      return false;  // always in camp
    case 'EX_STAY_IN':
      return !exStayInInCamp;
    case 'OTHERS':
      return status.outOfCamp;
    default:
      return false;
  }
}

/** Return the sorted list of distinct platoon numbers that exist in the database */
export async function getAvailablePlatoons(): Promise<number[]> {
  const rows = await prisma.recruit.findMany({
    select: { platoon: true },
    distinct: ['platoon'],
    orderBy: { platoon: 'asc' },
  });
  return rows.map(r => r.platoon);
}

export async function generateParadeState(date?: Date, platoonFilter?: number[]): Promise<ParadeStateResult> {
  const targetDate = date ?? normalizeToSGTDate(new Date());

  // Fetch recruits, optionally filtered by platoon numbers
  const recruits = await prisma.recruit.findMany({
    where: platoonFilter && platoonFilter.length > 0
      ? { platoon: { in: platoonFilter } }
      : undefined,
    orderBy: [{ platoon: 'asc' }, { section: 'asc' }, { bed: 'asc' }],
  });

  // Fetch all active statuses for the target date
  const activeStatuses = await prisma.statusRecord.findMany({
    where: {
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
  });

  // Build map: recruitId -> StatusRecord[]
  const statusMap = new Map<string, StatusRecord[]>();
  for (const status of activeStatuses) {
    const list = statusMap.get(status.recruitId) ?? [];
    list.push(status);
    statusMap.set(status.recruitId, list);
  }

  // Group recruits by platoon
  const platoonMap = new Map<number, Recruit[]>();
  for (const recruit of recruits) {
    const list = platoonMap.get(recruit.platoon) ?? [];
    list.push(recruit);
    platoonMap.set(recruit.platoon, list);
  }

  const today = normalizeToSGTDate(new Date());
  // For today: use the live SGT clock. For historical/future dates: always in-camp (deterministic).
  const exStayInInCamp = targetDate.getTime() === today.getTime() ? isExStayInInCamp() : true;

  // Build per-platoon parade state
  const platoons: PlatoonParadeState[] = [];

  const sortedPlatoonNumbers = [...platoonMap.keys()].sort((a, b) => a - b);

  for (const platoonNum of sortedPlatoonNumbers) {
    const platoonRecruits = platoonMap.get(platoonNum)!;
    const totalStrength = platoonRecruits.length;
    let outOfCamp = 0;

    const exStayIn: StatusEntry[] = [];
    const mcList: StatusEntry[] = [];
    const ldList: StatusEntry[] = [];
    let ldInCampCount = 0;
    const exList: StatusEntry[] = [];
    let exInCampCount = 0;
    const rsList: StatusEntry[] = [];
    const othersList: StatusEntry[] = [];

    for (const recruit of platoonRecruits) {
      const statuses = statusMap.get(recruit.id) ?? [];

      let recruitOutOfCamp = false;
      for (const s of statuses) {
        if (isOutOfCamp(s, exStayInInCamp)) {
          recruitOutOfCamp = true;
          break;
        }
      }
      if (recruitOutOfCamp) {
        outOfCamp++;
      }

      for (const s of statuses) {
        const entry: StatusEntry = { recruit, status: s };

        switch (s.type) {
          case 'MC':
            mcList.push(entry);
            break;

          case 'LD':
            ldList.push(entry);
            if (!recruitOutOfCamp) {
              ldInCampCount++;
            }
            break;

          case 'EX':
            exList.push(entry);
            if (!recruitOutOfCamp) {
              exInCampCount++;
            }
            break;

          case 'EX_STAY_IN':
            exStayIn.push(entry);
            break;

          case 'REPORTING_SICK':
            rsList.push(entry);
            break;

          case 'SEND_OUT_URGENT':
          case 'SEND_OUT_NON_URGENT':
          case 'OTHERS':
            othersList.push(entry);
            break;
        }
      }
    }

    const sortByRecruitId = (a: StatusEntry, b: StatusEntry) => a.recruit.id.localeCompare(b.recruit.id);
    exStayIn.sort(sortByRecruitId);
    mcList.sort(sortByRecruitId);
    ldList.sort(sortByRecruitId);
    exList.sort(sortByRecruitId);
    rsList.sort(sortByRecruitId);
    othersList.sort(sortByRecruitId);

    platoons.push({
      platoon: platoonNum,
      totalStrength,
      inCamp: totalStrength - outOfCamp,
      outOfCamp,
      exStayIn,
      exStayInInCamp,
      mcList,
      ldList,
      ldInCampCount,
      exList,
      exInCampCount,
      rsList,
      othersList,
    });
  }

  return { date: targetDate, platoons };
}
