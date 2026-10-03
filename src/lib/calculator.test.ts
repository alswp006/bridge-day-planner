import { describe, it, expect } from "vitest";
import type { AppInput, Combo, Holiday } from "@/lib/types";
import { calculate } from "@/lib/calculator";
import { parseKey } from "@/lib/date";

// 합성 fixture만 쓴다 — 실제 holidays.ts는 import하지 않는다.
// 2026-10-03은 토요일: 10-05 월, 10-06 화, 10-07 수, 10-08 목, 10-09 금, 10-10 토, 10-11 일.
const SAT = 6;
const SUN = 0;

const hol = (date: string, name: string): Holiday => ({ date, name, isSubstitute: false });
const dayOf = (key: string) => parseKey(key).getDay();
const raw = (c: Combo) => c.totalDays / c.leaveDates.length;
const allCombos = (r: ReturnType<typeof calculate>) => [...r.ranked, ...r.efficiencyTop];

describe("calculate — 합성 fixture 검증", () => {
  it("① 수요일 공휴일 1개 + 연차 2일 → 5일 이상, 주말을 끼고 시작·종료한다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 2 };
    const result = calculate(input, [hol("2026-10-07", "수요일 공휴일")]);

    expect(result.ranked.length).toBeGreaterThan(0);
    const top = result.ranked[0];
    expect(top.totalDays).toBeGreaterThanOrEqual(5);
    expect(top.leaveDates).toHaveLength(2);
    // 연차 2일로는 토~일(9일)이 불가능하다(월·화·목·금 = 4일 필요).
    // 최상위 구간은 토요일에 시작(토~수)하거나 일요일에 끝난다(수~일).
    expect(dayOf(top.start) === SAT || dayOf(top.end) === SUN).toBe(true);
    expect(top.start).toBe("2026-10-03");
    expect(top.end).toBe("2026-10-07");
  });

  it("② 공휴일이 없는 주말만의 구간은 어떤 후보에도 없다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 2 };
    const result = calculate(input, [hol("2026-10-07", "수요일 공휴일")]);

    const combos = [...allCombos(result), ...(result.nearest ? [result.nearest] : [])];
    expect(combos.length).toBeGreaterThan(0);
    for (const c of combos) {
      expect(c.holidayNames.length).toBeGreaterThan(0);
      // 토~일 2일짜리 순수 주말 구간
      expect(c.totalDays === 2 && dayOf(c.start) === SAT && dayOf(c.end) === SUN).toBe(false);
    }
  });

  it("③ 연차를 쓰지 않는 후보(leaveDates.length === 0)는 없다", () => {
    // 월요일 공휴일: 토~월은 연차 0일 연휴라 후보가 아니다
    const input: AppInput = { today: "2026-09-28", leaveDays: 2 };
    const result = calculate(input, [hol("2026-10-05", "월요일 공휴일")]);

    expect(result.ranked.length).toBeGreaterThan(0);
    for (const c of [...allCombos(result), ...(result.nearest ? [result.nearest] : [])]) {
      expect(c.leaveDates.length).toBeGreaterThan(0);
    }
    expect(result.ranked.some((c) => c.start === "2026-10-03" && c.end === "2026-10-05")).toBe(false);
  });

  it("④ ranked의 모든 쌍이 날짜 구간상 겹치지 않는다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 3 };
    const holidays = [
      hol("2026-10-05", "월 공휴일"),
      hol("2026-10-07", "수 공휴일"),
      hol("2026-10-12", "월 공휴일 2"),
      hol("2026-10-14", "수 공휴일 2"),
      hol("2026-10-21", "수 공휴일 3"),
    ];
    const { ranked } = calculate(input, holidays);

    expect(ranked.length).toBeGreaterThan(1);
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        const overlaps = ranked[i].start <= ranked[j].end && ranked[j].start <= ranked[i].end;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("⑤ 모든 Combo.efficiency는 소수 1자리 이하로 반올림된다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 3 };
    const holidays = [
      hol("2026-10-05", "월 공휴일"),
      hol("2026-10-07", "수 공휴일"),
      hol("2026-10-15", "목 공휴일"),
      hol("2026-10-21", "수 공휴일 2"),
    ];
    const result = calculate(input, holidays);

    const combos = allCombos(result);
    expect(combos.length).toBeGreaterThan(0);
    for (const c of combos) {
      expect(c.efficiency).toBe(Math.round(raw(c) * 10) / 10);
      expect(c.efficiency).toBe(Math.round(c.efficiency * 10) / 10);
    }
    // 7일 / 연차 3일 = 2.333… → 2.3
    const sample = calculate({ today: "2026-09-28", leaveDays: 3 }, [hol("2026-10-07", "수요일 공휴일")]);
    const threeLeave = sample.ranked.concat(sample.efficiencyTop).find((c) => c.leaveDates.length === 3);
    if (threeLeave) expect(threeLeave.efficiency).toBe(Math.round((threeLeave.totalDays / 3) * 10) / 10);
  });

  it("⑥ holidays가 [], undefined, null이면 예외 없이 빈 결과를 돌려준다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 2 };
    for (const holidays of [[], undefined, null] as Array<Holiday[] | null | undefined>) {
      const result = calculate(input, holidays);
      expect(result.ranked.length).toBe(0);
      expect(result.efficiencyTop.length).toBe(0);
      expect(result.nearest).toBeNull();
    }
  });

  it("⑦ 오늘이 일요일이고 전날(토)이 공휴일이면 그 구간은 start === today, dday === 0이다", () => {
    const today = "2026-10-04"; // 일요일
    expect(dayOf(today)).toBe(SUN);
    const holidays = [hol("2026-10-03", "토요일 공휴일"), hol("2026-10-06", "화요일 공휴일")];
    const result = calculate({ today, leaveDays: 1 }, holidays);

    // 일(오늘) · 월(연차) · 화(공휴일) — 전날 토요일이 휴일이어도 오늘부터 시작한다
    const combo = result.ranked.find((c) => c.end === "2026-10-06");
    expect(combo).toBeDefined();
    expect(combo!.start).toBe(today);
    expect(combo!.dday).toBe(0);
    expect(combo!.totalDays).toBe(3);
    expect(combo!.leaveDates).toEqual(["2026-10-05"]);
  });

  it("⑧ efficiencyTop은 반올림 전 효율 내림차순이고, ranked에 없는 후보도 들어갈 수 있다", () => {
    const input: AppInput = { today: "2026-09-28", leaveDays: 3 };
    const holidays = [
      hol("2026-10-07", "수 공휴일"), // 최고 효율 5/2 = 2.5
      hol("2026-10-13", "화 공휴일"), // 4/1 = 4
      hol("2026-10-22", "목 공휴일"), // 4/1 = 4
      hol("2026-11-04", "수 공휴일 2"),
    ];
    const result = calculate(input, holidays);

    expect(result.efficiencyTop.length).toBeGreaterThanOrEqual(2);
    expect(result.efficiencyTop.length).toBeLessThanOrEqual(3);
    // 정렬 기준은 반올림 전 값(totalDays / 연차일수)
    for (let i = 0; i < result.efficiencyTop.length - 1; i++) {
      expect(raw(result.efficiencyTop[i])).toBeGreaterThanOrEqual(raw(result.efficiencyTop[i + 1]));
    }
    // 반올림 값이 같으면 반올림 전 값이 큰 쪽이 앞이다
    for (let i = 0; i < result.efficiencyTop.length - 1; i++) {
      const a = result.efficiencyTop[i];
      const b = result.efficiencyTop[i + 1];
      if (a.efficiency === b.efficiency) expect(raw(a)).toBeGreaterThanOrEqual(raw(b));
    }
    // 풀은 전체 후보 — ranked(길이순)에 없는 효율순 후보가 있다
    const rankedKeys = new Set(result.ranked.map((c) => `${c.start}~${c.end}`));
    expect(result.efficiencyTop.some((c) => !rankedKeys.has(`${c.start}~${c.end}`))).toBe(true);
  });
});
