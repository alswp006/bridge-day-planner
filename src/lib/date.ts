import type { DateKey } from "@/lib/types";

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Date → 'YYYY-MM-DD' (로컬 날짜) */
export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' → 로컬 자정 Date */
export function parseKey(k: DateKey): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: DateKey, n: number): DateKey {
  const [y, m, d] = k.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + n));
}

/** a - b (일 단위). 서머타임 대비 반올림 */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / DAY_MS);
}

export function weekdayKo(k: DateKey): string {
  return WEEKDAYS_KO[parseKey(k).getDay()];
}

/** 토·일 또는 공휴일이면 휴무일 */
export function isOffDay(k: DateKey, holidaySet: Set<DateKey>): boolean {
  const day = parseKey(k).getDay();
  return day === 0 || day === 6 || holidaySet.has(k);
}

function toKoreanDay(k: DateKey): string {
  const d = parseKey(k);
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAYS_KO[d.getDay()]})`;
}

/** '10월 9일(금) ~ 10월 11일(일)', 하루짜리는 '10월 5일(월)' */
export function formatRange(start: DateKey, end: DateKey): string {
  if (start === end) return toKoreanDay(start);
  return `${toKoreanDay(start)} ~ ${toKoreanDay(end)}`;
}

/** '10/5(월)' */
export function toMD(k: DateKey): string {
  const d = parseKey(k);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS_KO[d.getDay()]})`;
}

/** 0 → 'D-DAY', n → 'D-n' */
export function ddayLabel(n: number): string {
  return n === 0 ? "D-DAY" : `D-${n}`;
}
