import type { ParsedRecruitId } from '../types/index.js';

export function parseRecruitId(id: string): ParsedRecruitId {
  if (!/^\d{4}$/.test(id)) {
    throw new Error(`Invalid recruit ID "${id}": must be exactly 4 digits`);
  }

  const platoon = parseInt(id[0], 10);
  const section = parseInt(id[1], 10);
  const bed = parseInt(id.substring(2), 10);

  if (platoon === 0) {
    throw new Error(`Invalid recruit ID "${id}": platoon (first digit) cannot be 0`);
  }
  if (section === 0) {
    throw new Error(`Invalid recruit ID "${id}": section (second digit) cannot be 0`);
  }
  if (bed === 0) {
    throw new Error(`Invalid recruit ID "${id}": bed (last two digits) cannot be 00`);
  }

  return { platoon, section, bed };
}
