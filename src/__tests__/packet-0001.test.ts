import { describe, it, expect } from "vitest";
import type {
  DateKey,
  Holiday,
  AppInput,
  Combo,
  AppResult,
  RouteState,
} from "@/lib/types";
import {
  STORAGE_KEY_LAST_LEAVE,
  LEAVE_MIN,
  LEAVE_MAX,
  SEARCH_END,
} from "@/lib/types";
import { HOLIDAYS, HOLIDAY_DATA_LAST_YEAR } from "@/data/holidays";

describe("Types & Constants + 공휴일 데이터 (Packet 0001)", () => {
  // AC-1: types.ts exports all required types and 4 constants
  it("AC-1: STORAGE_KEY_LAST_LEAVE constant value", () => {
    expect(STORAGE_KEY_LAST_LEAVE).toBe("bridge-day:lastLeave");
  });

  it("AC-1: LEAVE_MIN, LEAVE_MAX, SEARCH_END constants", () => {
    expect(LEAVE_MIN).toBe(1);
    expect(LEAVE_MAX).toBe(25);
    expect(SEARCH_END).toBe("2027-12-31");
  });

  // AC-2: HOLIDAYS array has exactly 24 items with correct structure
  it("AC-2: HOLIDAYS array length is 24", () => {
    expect(HOLIDAYS).toHaveLength(24);
  });

  it("AC-2: Every holiday has required fields (date, name, isSubstitute)", () => {
    HOLIDAYS.forEach((holiday, idx) => {
      expect(holiday, `Holiday at index ${idx}`).toHaveProperty("date");
      expect(holiday, `Holiday at index ${idx}`).toHaveProperty("name");
      expect(holiday, `Holiday at index ${idx}`).toHaveProperty("isSubstitute");
    });
  });

  it("AC-2: All dates are in YYYY-MM-DD format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    HOLIDAYS.forEach((holiday) => {
      expect(holiday.date).toMatch(dateRegex);
      const [year, month, day] = holiday.date.split("-").map(Number);
      expect(year).toBeGreaterThanOrEqual(2026);
      expect(year).toBeLessThanOrEqual(2027);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  it("AC-2: All holiday names are non-empty strings", () => {
    HOLIDAYS.forEach((holiday) => {
      expect(typeof holiday.name).toBe("string");
      expect(holiday.name.length).toBeGreaterThan(0);
    });
  });

  // AC-2b: Substitute holidays (isSubstitute=true) are exactly 6 specific dates
  it("AC-2b: Exactly 6 substitute holidays with correct dates", () => {
    const substituteHolidays = HOLIDAYS.filter((h) => h.isSubstitute === true);
    expect(substituteHolidays).toHaveLength(6);

    const substituteDates = substituteHolidays.map((h) => h.date).sort();
    const expectedSubstituteDates = [
      "2026-10-05",
      "2027-02-08",
      "2027-08-16",
      "2027-10-04",
      "2027-10-11",
      "2027-12-27",
    ].sort();

    expect(substituteDates).toEqual(expectedSubstituteDates);
  });

  // AC-3: holidays.ts has source comments and validation date (verified by reading file)
  // AC-3 & AC-5: HOLIDAY_DATA_LAST_YEAR is exported and equals 2027
  it("AC-3 & AC-5: HOLIDAY_DATA_LAST_YEAR is 2027", () => {
    expect(HOLIDAY_DATA_LAST_YEAR).toBe(2027);
  });

  // AC-4: No https:// strings in holidays.ts (verified by grep in pipeline)
  // This is validated at the file level, not through module exports
  // Implicit test: if holidays.ts has https://, the code would break (but we can't test this directly)
});
