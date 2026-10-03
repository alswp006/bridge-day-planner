import type { AppInput, AppResult, Combo, DateKey, Holiday } from "@/lib/types";
import { SEARCH_END } from "@/lib/types";
import { addDays, diffDays, isOffDay } from "@/lib/date";

export {
  toKey,
  parseKey,
  addDays,
  diffDays,
  weekdayKo,
  isOffDay,
  formatRange,
  toMD,
  ddayLabel,
} from "@/lib/date";

const MAX_RANKED = 5;
const MAX_EFFICIENCY = 3;
const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function emptyResult(): AppResult {
  return { ranked: [], efficiencyTop: [], nearest: null };
}

/** 후보 + 정렬용 반올림 전 효율 */
interface Candidate {
  combo: Combo;
  rawEfficiency: number;
}

function compareRanked(a: Candidate, b: Candidate): number {
  return (
    b.combo.totalDays - a.combo.totalDays ||
    a.combo.leaveDates.length - b.combo.leaveDates.length ||
    (a.combo.start < b.combo.start ? -1 : a.combo.start > b.combo.start ? 1 : 0)
  );
}

function compareEfficiency(a: Candidate, b: Candidate): number {
  return (
    b.rawEfficiency - a.rawEfficiency ||
    b.combo.totalDays - a.combo.totalDays ||
    (a.combo.start < b.combo.start ? -1 : a.combo.start > b.combo.start ? 1 : 0)
  );
}

/** 정렬된 후보에서 앞 순위와 하루도 겹치지 않는 것만 limit개 뽑는다 */
function pickNonOverlapping(sorted: Candidate[], limit: number): Combo[] {
  const picked: Combo[] = [];
  for (const { combo } of sorted) {
    if (picked.length >= limit) break;
    const overlaps = picked.some((p) => combo.start <= p.end && p.start <= combo.end);
    if (!overlaps) picked.push(combo);
  }
  return picked;
}

export function calculate(
  input: AppInput,
  holidays: Holiday[] | null | undefined,
): AppResult {
  if (!Array.isArray(holidays) || holidays.length === 0) return emptyResult();
  if (!input || !KEY_PATTERN.test(input.today)) return emptyResult();

  const { today, leaveDays } = input;
  const span = diffDays(SEARCH_END, today) + 1;
  if (span <= leaveDays || !(leaveDays >= 1)) return emptyResult();

  const holidayNameByDate = new Map<DateKey, string>();
  for (const h of holidays) {
    if (!holidayNameByDate.has(h.date)) holidayNameByDate.set(h.date, h.name);
  }
  const holidaySet = new Set<DateKey>(holidayNameByDate.keys());

  // 하루씩: 날짜 키, 휴무 여부, 연차 필요 여부, 공휴일 여부
  const keys: DateKey[] = [];
  const off: boolean[] = [];
  const leavePrefix: number[] = [0];
  const holidayPrefix: number[] = [0];
  for (let i = 0; i < span; i++) {
    const key = addDays(today, i);
    const isOff = isOffDay(key, holidaySet);
    keys.push(key);
    off.push(isOff);
    leavePrefix.push(leavePrefix[i] + (isOff ? 0 : 1));
    holidayPrefix.push(holidayPrefix[i] + (holidaySet.has(key) ? 1 : 0));
  }

  const candidates: Candidate[] = [];
  for (let s = 0; s < span; s++) {
    // (c) 시작일 전날은 근무일이거나 구간 경계
    if (s > 0 && off[s - 1]) continue;
    for (let e = s; e < span; e++) {
      const leaveCount = leavePrefix[e + 1] - leavePrefix[s];
      if (leaveCount > leaveDays) break;
      // (c) 종료일 다음 날은 근무일이거나 구간 경계
      if (e < span - 1 && off[e + 1]) continue;
      // (a) 연차 1일 이상, (b) 공휴일 1일 이상
      if (leaveCount < 1) continue;
      if (holidayPrefix[e + 1] - holidayPrefix[s] < 1) continue;

      const leaveDates: DateKey[] = [];
      const holidayNames: string[] = [];
      for (let i = s; i <= e; i++) {
        if (!off[i]) leaveDates.push(keys[i]);
        const name = holidayNameByDate.get(keys[i]);
        if (name !== undefined && !holidayNames.includes(name)) holidayNames.push(name);
      }
      const totalDays = e - s + 1;
      const rawEfficiency = totalDays / leaveCount;
      candidates.push({
        rawEfficiency,
        combo: {
          start: keys[s],
          end: keys[e],
          totalDays,
          leaveDates,
          holidayNames,
          efficiency: Math.round(rawEfficiency * 10) / 10,
          dday: s,
        },
      });
    }
  }

  if (candidates.length === 0) return emptyResult();

  const byRank = [...candidates].sort(compareRanked);
  const ranked = pickNonOverlapping(byRank, MAX_RANKED);
  const efficiencyTop = pickNonOverlapping(
    [...candidates].sort(compareEfficiency),
    MAX_EFFICIENCY,
  );

  // 시작일이 가장 빠른 조합, 동률이면 순위 기준 첫 번째
  let nearest = byRank[0].combo;
  for (const { combo } of byRank) {
    if (combo.start < nearest.start) nearest = combo;
  }

  return { ranked, efficiencyTop, nearest };
}
