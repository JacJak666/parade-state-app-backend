import { calculateDuration, formatDateToDDMMYY, zeroPad } from '../utils/dateUtils.js';
import type { StatusEntry, PlatoonParadeState, ParadeStateResult } from '../types/index.js';

function formatExStayInLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const start = formatDateToDDMMYY(status.startDate);
  const end = formatDateToDDMMYY(status.endDate);
  return `${recruit.id} - (${start}-${end})`;
}

function formatMcLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const duration = calculateDuration(status.startDate, status.endDate);
  const start = formatDateToDDMMYY(status.startDate);
  const end = formatDateToDDMMYY(status.endDate);
  return `${recruit.id} - ${duration}D MC (${start}-${end})`;
}

function formatLdLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const duration = calculateDuration(status.startDate, status.endDate);
  const start = formatDateToDDMMYY(status.startDate);
  const end = formatDateToDDMMYY(status.endDate);
  return `${recruit.id} - ${duration}D LD (${start}-${end})`;
}

function formatExLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const duration = calculateDuration(status.startDate, status.endDate);
  const start = formatDateToDDMMYY(status.startDate);
  const end = formatDateToDDMMYY(status.endDate);
  const remarkPart = status.remark ? ` ${status.remark}` : '';
  return `${recruit.id} - ${duration}D EX${remarkPart} (${start}-${end})`;
}

function formatRsLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const remarkPart = status.remark ? status.remark : '';
  return `${recruit.id} - reporting sick for ${remarkPart}`.trimEnd();
}

function formatOthersLine(entry: StatusEntry): string {
  const { recruit, status } = entry;
  const duration = calculateDuration(status.startDate, status.endDate);
  const start = formatDateToDDMMYY(status.startDate);
  const end = formatDateToDDMMYY(status.endDate);
  const typeName = formatOthersTypeName(status.type);
  const remarkPart = status.remark ? ` ${status.remark}` : '';
  return `${recruit.id} - ${duration}D ${typeName}${remarkPart} (${start}-${end})`;
}

function formatOthersTypeName(type: string): string {
  switch (type) {
    case 'SEND_OUT_URGENT': return 'SEND OUT URGENT';
    case 'SEND_OUT_NON_URGENT': return 'SEND OUT NON URGENT';
    default: return type;
  }
}

function formatPlatoonBlock(ps: PlatoonParadeState): string {
  const lines: string[] = [];

  // Header
  lines.push(`Platoon ${ps.platoon}: ${zeroPad(ps.inCamp)}/${zeroPad(ps.totalStrength)}`);
  lines.push(`Out of Camp: ${zeroPad(ps.outOfCamp)}`);
  lines.push('');

  // EX STAY IN
  const exStayInInCampCount = ps.exStayInInCamp ? ps.exStayIn.length : 0;
  lines.push(`EX STAY IN: ${zeroPad(exStayInInCampCount)}/${zeroPad(ps.exStayIn.length)}`);
  for (const entry of ps.exStayIn) {
    lines.push(formatExStayInLine(entry));
  }
  lines.push('');

  // MC
  lines.push(`MC: ${zeroPad(ps.mcList.length)}`);
  for (const entry of ps.mcList) {
    lines.push(formatMcLine(entry));
  }
  lines.push('');

  // Status divider
  lines.push(`Status: ${zeroPad(ps.statusUniqueCount)}/${zeroPad(ps.statusUniqueCount)}`);
  lines.push('');

  // LD
  lines.push(`LD: ${zeroPad(ps.ldList.length)}/${zeroPad(ps.ldList.length)}`);
  for (const entry of ps.ldList) {
    lines.push(formatLdLine(entry));
  }
  lines.push('');

  // EX (full detail)
  lines.push(`EX: ${zeroPad(ps.exInCampCount)}/${zeroPad(ps.exList.length)}`);
  for (const entry of ps.exList) {
    lines.push(formatExLine(entry));
  }
  lines.push('');

  // RS
  lines.push(`RS: ${zeroPad(ps.rsList.length)}`);
  for (const entry of ps.rsList) {
    lines.push(formatRsLine(entry));
  }
  lines.push('');

  // OTHERS
  lines.push(`OTHERS: ${zeroPad(ps.othersList.length)}`);
  for (const entry of ps.othersList) {
    lines.push(formatOthersLine(entry));
  }

  return lines.join('\n');
}

export function formatParadeState(result: ParadeStateResult): string {
  const blocks = result.platoons.map(formatPlatoonBlock);
  return blocks.join('\n\n');
}
