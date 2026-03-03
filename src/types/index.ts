import type { Recruit, StatusRecord, StatusType } from '../../prisma/generated/prisma/client.js';

export type { Recruit, StatusRecord, StatusType };

export interface CreateRecruitInput {
  id: string;
}

export interface CreateStatusInput {
  recruitId: string;
  type: StatusType;
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
  remark?: string;
  outOfCamp?: boolean; // only meaningful for OTHERS type
}

export interface ParsedRecruitId {
  platoon: number;
  section: number;
  bed: number;
}

export interface StatusEntry {
  recruit: Recruit;
  status: StatusRecord;
}

export interface StatusCategory {
  label: string;
  entries: StatusEntry[];
}

export interface PlatoonParadeState {
  platoon: number;
  totalStrength: number;
  inCamp: number;
  outOfCamp: number;
  exStayIn: StatusEntry[];
  exStayInInCamp: boolean;   // true if current SGT time is 0800–2000
  mcList: StatusEntry[];
  statusUniqueCount: number; // unique recruits with in-camp statuses
  ldList: StatusEntry[];
  exList: StatusEntry[];     // all EX entries with full detail
  exInCampCount: number;     // EX entries whose recruit is not overridden out-of-camp
  rsList: StatusEntry[];
  othersList: StatusEntry[];
}

export interface ParadeStateResult {
  date: Date;
  platoons: PlatoonParadeState[];
}
