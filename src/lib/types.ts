// Domain types — SPEC Data Model

/** 'YYYY-MM-DD' (로컬 날짜, 타임존 변환 금지) */
export type DateKey = string;

export interface Holiday {
  date: DateKey;
  name: string;
  isSubstitute: boolean;
}

/** leaveDays는 LEAVE_MIN~LEAVE_MAX 정수 */
export interface AppInput {
  leaveDays: number;
  today: DateKey;
}

export interface Combo {
  start: DateKey;
  end: DateKey;
  /** 연속 휴일 일수 */
  totalDays: number;
  /** 연차 써야 하는 날 (length = 연차 사용일) */
  leaveDates: DateKey[];
  /** 구간에 들어 있는 공휴일 이름 */
  holidayNames: string[];
  /** totalDays / leaveDates.length, 소수 1자리 반올림 (정렬은 반올림 전 값) */
  efficiency: number;
  /** start - today (0 = D-DAY) */
  dday: number;
}

export interface AppResult {
  /** 길이순 최대 5개, 서로 겹치지 않음 */
  ranked: Combo[];
  /** 효율순 최대 3개, 서로 겹치지 않음 (풀 = 전체 후보) */
  efficiencyTop: Combo[];
  /** 전체 후보 중 시작일이 가장 빠른 조합 */
  nearest: Combo | null;
}

/** react-router navigate state */
export interface RouteState {
  result: AppResult;
  input: AppInput;
}

export const STORAGE_KEY_LAST_LEAVE = "bridge-day:lastLeave";
export const LEAVE_MIN = 1;
export const LEAVE_MAX = 25;
export const SEARCH_END = "2027-12-31";
