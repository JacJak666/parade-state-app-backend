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
  ldList: StatusEntry[];
  ldInCampCount: number;     // unique recruits on LD who are not overridden out-of-camp
  ldTotalCount: number;      // unique recruits on LD
  exList: StatusEntry[];     // all EX entries with full detail
  exInCampCount: number;     // unique recruits on EX who are not overridden out-of-camp
  exTotalCount: number;      // unique recruits on EX
  rsList: StatusEntry[];
  othersList: StatusEntry[];
}

export interface ParadeStateResult {
  date: Date;
  platoons: PlatoonParadeState[];
}
