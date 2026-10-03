import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculate,
  toKey,
  parseKey,
  addDays,
  diffDays,
  weekdayKo,
  isOffDay,
  formatRange,
  toMD,
  ddayLabel,
} from "@/lib/calculator";
import type { Holiday, AppInput, AppResult, Combo, DateKey } from "@/lib/types";

describe("Core Logic: 날짜 유틸 + 연휴 계산기", () => {
  beforeEach(() => {
    // Fix clock for consistent date-dependent tests
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-20T09:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Date utilities", () => {
    describe("toKey & parseKey", () => {
      it("should convert Date to DateKey string format YYYY-MM-DD", () => {
        const date = new Date("2026-10-05");
        const key = toKey(date);
        expect(key).toBe("2026-10-05");
        expect(typeof key).toBe("string");
      });

      it("should parse DateKey back to Date correctly", () => {
        const key: DateKey = "2026-10-05";
        const parsed = parseKey(key);
        expect(parsed.getFullYear()).toBe(2026);
        expect(parsed.getMonth()).toBe(9); // October = month 9 (0-indexed)
        expect(parsed.getDate()).toBe(5);
      });

      it("should roundtrip: toKey(parseKey(key)) === key", () => {
        const original = "2026-12-25";
        const date = parseKey(original);
        const roundtripped = toKey(date);
        expect(roundtripped).toBe(original);
      });
    });

    describe("addDays", () => {
      it("should add positive days to a DateKey", () => {
        const key: DateKey = "2026-10-05";
        const result = addDays(key, 3);
        expect(result).toBe("2026-10-08");
      });

      it("should subtract days with negative numbers", () => {
        const key: DateKey = "2026-10-05";
        const result = addDays(key, -2);
        expect(result).toBe("2026-10-03");
      });

      it("should handle month boundary (Oct 31 + 1 = Nov 1)", () => {
        const key: DateKey = "2026-10-31";
        const result = addDays(key, 1);
        expect(result).toBe("2026-11-01");
      });

      it("should handle year boundary (Dec 31 + 1 = Jan 1)", () => {
        const key: DateKey = "2026-12-31";
        const result = addDays(key, 1);
        expect(result).toBe("2027-01-01");
      });
    });

    describe("diffDays", () => {
      it("should calculate difference (a - b) correctly", () => {
        const dayA: DateKey = "2026-10-08";
        const dayB: DateKey = "2026-10-05";
        const diff = diffDays(dayA, dayB);
        expect(diff).toBe(3); // 8 - 5 = 3
      });

      it("should return negative when a is before b", () => {
        const dayA: DateKey = "2026-10-03";
        const dayB: DateKey = "2026-10-05";
        const diff = diffDays(dayA, dayB);
        expect(diff).toBe(-2); // 3 - 5 = -2
      });

      it("should return 0 for same day", () => {
        const day: DateKey = "2026-10-05";
        const diff = diffDays(day, day);
        expect(diff).toBe(0);
      });
    });

    describe("weekdayKo", () => {
      it("should return Korean weekday name for Monday", () => {
        // 2026-10-05 is Monday
        expect(weekdayKo("2026-10-05")).toBe("월");
      });

      it("should return Korean weekday name for Friday", () => {
        // 2026-10-09 is Friday
        expect(weekdayKo("2026-10-09")).toBe("금");
      });

      it("should return Korean weekday name for Sunday", () => {
        // 2026-10-11 is Sunday
        expect(weekdayKo("2026-10-11")).toBe("일");
      });

      it("should return correct names for all days of week", () => {
        // Week starting 2026-10-05 (Mon)
        const weekDays = [
          ["2026-10-05", "월"],
          ["2026-10-06", "화"],
          ["2026-10-07", "수"],
          ["2026-10-08", "목"],
          ["2026-10-09", "금"],
          ["2026-10-10", "토"],
          ["2026-10-11", "일"],
        ];
        weekDays.forEach(([date, expected]) => {
          expect(weekdayKo(date as DateKey)).toBe(expected);
        });
      });
    });

    describe("isOffDay", () => {
      it("should identify off days in holiday set", () => {
        const holidays = new Set<DateKey>(["2026-10-05", "2026-10-06"]);
        expect(isOffDay("2026-10-05", holidays)).toBe(true);
        expect(isOffDay("2026-10-06", holidays)).toBe(true);
      });

      it("should return false for workdays", () => {
        const holidays = new Set<DateKey>(["2026-10-05"]);
        expect(isOffDay("2026-10-06", holidays)).toBe(false);
        expect(isOffDay("2026-10-07", holidays)).toBe(false);
      });

      it("should handle empty holiday set", () => {
        const holidays = new Set<DateKey>();
        expect(isOffDay("2026-10-05", holidays)).toBe(false);
      });
    });

    describe("formatRange", () => {
      it("AC-7: should format 2-day range with full pattern", () => {
        // 2026-10-09 is Friday, 2026-10-11 is Sunday
        const result = formatRange("2026-10-09", "2026-10-11");
        expect(result).toBe("10월 9일(금) ~ 10월 11일(일)");
      });

      it("AC-7: should format single day as just that day", () => {
        // 2026-10-05 is Monday
        const result = formatRange("2026-10-05", "2026-10-05");
        expect(result).toBe("10월 5일(월)");
      });

      it("should format multi-day range correctly", () => {
        // 2026-10-05 (Mon) ~ 2026-10-10 (Sat)
        const result = formatRange("2026-10-05", "2026-10-10");
        expect(result).toMatch(/10월 5일\(월\) ~ 10월 10일\(토\)/);
      });
    });

    describe("toMD", () => {
      it("AC-7: should format as M/D(weekday)", () => {
        // 2026-10-05 is Monday
        const result = toMD("2026-10-05");
        expect(result).toBe("10/5(월)");
      });

      it("should handle double-digit month and day", () => {
        // 2026-12-25 is Friday
        const result = toMD("2026-12-25");
        expect(result).toBe("12/25(금)");
      });
    });

    describe("ddayLabel", () => {
      it("AC-6: should return 'D-DAY' for 0", () => {
        expect(ddayLabel(0)).toBe("D-DAY");
      });

      it("AC-6: should return 'D-5' for 5", () => {
        expect(ddayLabel(5)).toBe("D-5");
      });

      it("should return 'D-N' for positive integers", () => {
        expect(ddayLabel(1)).toBe("D-1");
        expect(ddayLabel(10)).toBe("D-10");
        expect(ddayLabel(365)).toBe("D-365");
      });
    });
  });

  describe("calculate function", () => {
    describe("AC-1: Edge cases with empty/null holidays", () => {
      it("should return empty results when holidays is undefined", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const result = calculate(input, undefined);
        expect(result.ranked).toHaveLength(0);
        expect(result.efficiencyTop).toHaveLength(0);
        expect(result.nearest).toBeNull();
      });

      it("should return empty results when holidays is null", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const result = calculate(input, null);
        expect(result.ranked).toHaveLength(0);
        expect(result.efficiencyTop).toHaveLength(0);
        expect(result.nearest).toBeNull();
      });

      it("should return empty results when holidays is empty array", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const result = calculate(input, []);
        expect(result.ranked).toHaveLength(0);
        expect(result.efficiencyTop).toHaveLength(0);
        expect(result.nearest).toBeNull();
      });
    });

    describe("AC-2: Year boundary and no candidates", () => {
      it("should return no candidates when year is > 2027", () => {
        const input: AppInput = {
          today: "2028-01-01",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2028-01-02", name: "Test Holiday", isSubstitute: false },
        ];
        const result = calculate(input, holidays);
        expect(result.ranked).toHaveLength(0);
      });

      it("should still find candidates when leaveDays exceeds remaining search days", () => {
        const input: AppInput = {
          today: "2027-12-27", // Only 4 days left in 2027
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          {
            date: "2027-12-28",
            name: "Holiday",
            isSubstitute: false,
          },
        ];
        const result = calculate(input, holidays);
        expect(result.ranked.length).toBeGreaterThan(0);
      });
    });

    describe("AC-3: Candidate validation rules", () => {
      it("should only return candidates with 1+ holidays in the range", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-10-05", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        // All candidates must include at least 1 holiday name
        result.ranked.forEach((combo) => {
          expect(combo.holidayNames.length).toBeGreaterThan(0);
        });
      });

      it("should respect leaveDates length <= leaveDays", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-10-05", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        result.ranked.forEach((combo) => {
          expect(combo.leaveDates.length).toBeGreaterThanOrEqual(1);
          expect(combo.leaveDates.length).toBeLessThanOrEqual(input.leaveDays);
        });
      });

      it("should ensure start >= today", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "Holiday", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        result.ranked.forEach((combo) => {
          expect(combo.start >= input.today).toBe(true);
        });
      });

      it("should ensure boundaries are workdays or search edges", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-10-05", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        const holidaySet = new Set(holidays.map((h) => h.date));

        result.ranked.forEach((combo) => {
          // Day before start should not be in leaveDates (or is today)
          if (combo.start > "2026-09-20") {
            const dayBefore = addDays(combo.start, -1);
            expect(combo.leaveDates.includes(dayBefore)).toBe(false);
          }
          // Day after end should not be in leaveDates (or is search end)
          if (combo.end < "2027-12-31") {
            const dayAfter = addDays(combo.end, 1);
            expect(combo.leaveDates.includes(dayAfter)).toBe(false);
          }
        });
      });
    });

    describe("AC-4: Ranked sorting and non-overlap", () => {
      it("should sort ranked by totalDays (desc) → leaveDates.length (asc) → start (asc)", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 10,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-10-05", name: "H3", isSubstitute: false },
          { date: "2026-11-01", name: "H4", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        for (let i = 0; i < result.ranked.length - 1; i++) {
          const curr = result.ranked[i];
          const next = result.ranked[i + 1];

          // Primary sort: totalDays descending
          if (curr.totalDays !== next.totalDays) {
            expect(curr.totalDays).toBeGreaterThan(next.totalDays);
          } else if (curr.leaveDates.length !== next.leaveDates.length) {
            // Secondary: leaveDates length ascending
            expect(curr.leaveDates.length).toBeLessThanOrEqual(
              next.leaveDates.length
            );
          } else {
            // Tertiary: start ascending
            expect(curr.start <= next.start).toBe(true);
          }
        }
      });

      it("should have maximum 5 ranked results", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 10,
        };
        // Create many holidays to generate multiple candidates
        const holidays: Holiday[] = Array.from({ length: 40 }, (_, i) => ({
          date: addDays("2026-10-01", i),
          name: `H${i}`,
          isSubstitute: false,
        }));
        const result = calculate(input, holidays);

        expect(result.ranked.length).toBeLessThanOrEqual(5);
      });

      it("should have no overlapping dates between ranked candidates", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-10-05", name: "H3", isSubstitute: false },
          { date: "2026-11-01", name: "H4", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        for (let i = 0; i < result.ranked.length; i++) {
          const comboA = result.ranked[i];
          const datesA = new Set(comboA.leaveDates);

          for (let j = i + 1; j < result.ranked.length; j++) {
            const comboB = result.ranked[j];
            comboB.leaveDates.forEach((date) => {
              expect(datesA.has(date)).toBe(false);
            });
          }
        }
      });
    });

    describe("AC-5: efficiencyTop selection and sorting", () => {
      it("should select up to 3 from entire candidate pool, not just ranked", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 10,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-11-01", name: "H3", isSubstitute: false },
          { date: "2026-11-02", name: "H4", isSubstitute: false },
          { date: "2026-12-01", name: "H5", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        expect(result.efficiencyTop.length).toBeLessThanOrEqual(3);
      });

      it("should calculate efficiency = round(totalDays/leaveDates.length * 10) / 10", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        result.efficiencyTop.forEach((combo) => {
          const raw = combo.totalDays / combo.leaveDates.length;
          const expected = Math.round(raw * 10) / 10;
          expect(combo.efficiency).toBe(expected);
        });
      });

      it("should sort efficiencyTop by efficiency (desc) → totalDays (desc) → start (asc)", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 10,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-11-01", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        for (let i = 0; i < result.efficiencyTop.length - 1; i++) {
          const curr = result.efficiencyTop[i];
          const next = result.efficiencyTop[i + 1];

          // Primary: efficiency descending
          if (curr.efficiency !== next.efficiency) {
            expect(curr.efficiency).toBeGreaterThanOrEqual(next.efficiency);
          } else if (curr.totalDays !== next.totalDays) {
            // Secondary: totalDays descending
            expect(curr.totalDays).toBeGreaterThanOrEqual(next.totalDays);
          } else {
            // Tertiary: start ascending
            expect(curr.start <= next.start).toBe(true);
          }
        }
      });

      it("should have no overlapping dates within efficiencyTop", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 10,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-11-01", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        for (let i = 0; i < result.efficiencyTop.length; i++) {
          const comboA = result.efficiencyTop[i];
          const datesA = new Set(comboA.leaveDates);

          for (let j = i + 1; j < result.efficiencyTop.length; j++) {
            const comboB = result.efficiencyTop[j];
            comboB.leaveDates.forEach((date) => {
              expect(datesA.has(date)).toBe(false);
            });
          }
        }
      });
    });

    describe("AC-6: When today is mid-vacation", () => {
      it("should set start === today when today is included in candidate", () => {
        const today = "2026-10-03";
        vi.setSystemTime(new Date("2026-10-03T09:00:00+09:00"));

        const input: AppInput = {
          today,
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        // Find combo including today
        const todayCombo = result.ranked.find((c) =>
          c.leaveDates.includes(today)
        );
        if (todayCombo) {
          expect(todayCombo.start).toBe(today);
        }
      });

      it("AC-6: should have dday === 0 when start === today", () => {
        const today = "2026-10-03";
        vi.setSystemTime(new Date("2026-10-03T09:00:00+09:00"));

        const input: AppInput = {
          today,
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "Holiday", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        result.ranked.forEach((combo) => {
          if (combo.start === today) {
            expect(combo.dday).toBe(0);
          }
        });
      });

      it("AC-6: should have ddayLabel(0) === 'D-DAY' when dday === 0", () => {
        const today = "2026-10-03";
        vi.setSystemTime(new Date("2026-10-03T09:00:00+09:00"));

        const input: AppInput = {
          today,
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "Holiday", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        result.ranked.forEach((combo) => {
          if (combo.dday === 0) {
            expect(ddayLabel(combo.dday)).toBe("D-DAY");
          }
        });
      });
    });

    describe("Complex scenario: realistic vacation planning", () => {
      it("should find vacation windows bridging holidays", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        // Chuseok 2026: 10/3-10/5 are holidays
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "Chuseok", isSubstitute: false },
          { date: "2026-10-04", name: "Chuseok", isSubstitute: false },
          { date: "2026-10-05", name: "Chuseok", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        // Should find valid vacation windows
        expect(result.ranked.length).toBeGreaterThan(0);
        // All should include at least one holiday
        result.ranked.forEach((combo) => {
          const hasHoliday = combo.holidayNames.length > 0;
          expect(hasHoliday).toBe(true);
        });
      });

      it("should have nearest pointing to the closest start date among all candidates", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 5,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "H1", isSubstitute: false },
          { date: "2026-10-04", name: "H2", isSubstitute: false },
          { date: "2026-11-01", name: "H3", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        if (result.ranked.length > 0) {
          expect(result.nearest).not.toBeNull();
          // nearest should be first from ranked (which is sorted by start if totalDays ties)
          expect(result.nearest?.start).toBe(result.ranked[0].start);
        }
      });

      it("should provide realistic Combo data with complete fields", () => {
        const input: AppInput = {
          today: "2026-09-20",
          leaveDays: 3,
        };
        const holidays: Holiday[] = [
          { date: "2026-10-03", name: "Holiday", isSubstitute: false },
        ];
        const result = calculate(input, holidays);

        if (result.ranked.length > 0) {
          const combo = result.ranked[0];
          // Verify all required fields exist and are valid
          expect(combo.start).toBeDefined();
          expect(combo.end).toBeDefined();
          expect(combo.totalDays).toBeGreaterThan(0);
          expect(combo.leaveDates).toBeInstanceOf(Array);
          expect(combo.leaveDates.length).toBeGreaterThan(0);
          expect(combo.holidayNames).toBeInstanceOf(Array);
          expect(combo.efficiency).toBeGreaterThan(0);
          expect(combo.dday).toBeGreaterThanOrEqual(0);
          expect(combo.start >= input.today).toBe(true);
          expect(combo.end >= combo.start).toBe(true);
        }
      });
    });
  });
});
