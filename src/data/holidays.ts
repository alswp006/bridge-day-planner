/**
 * 공휴일 데이터 (2026-10 ~ 2027-12)
 *
 * 출처: 한국천문연구원 특일정보, 관공서의 공휴일에 관한 규정
 * 검증 일자: [검증 필요] — 출처와 대조하지 못한 SPEC 초안 값이다(F1-AC-8 미통과).
 *   대조를 마치면 이 줄을 'YYYY-MM-DD' 검증 일자로 바꾼다.
 *
 * 이 파일에 외부 주소 문자열을 넣지 않는다(출처는 기관 이름으로만 적는다).
 *
 * TODO: 제헌절(7/17)이 공휴일로 다시 지정됐는지 확인 — 확인 전에는 데이터에서 뺀다.
 * TODO: 노동절(5/1)이 관공서 공휴일인지 확인 — 확인 전에는 데이터에서 뺀다.
 * TODO: 2027년 임시공휴일 지정 여부 확인 — 지정되면 항목을 추가하고 HOLIDAY_DATA_LAST_YEAR를 점검한다.
 */
import type { Holiday } from "@/lib/types";

/** 데이터가 커버하는 마지막 연도 */
export const HOLIDAY_DATA_LAST_YEAR = 2027;

export const HOLIDAYS: Holiday[] = [
  { date: "2026-10-03", name: "개천절", isSubstitute: false },
  { date: "2026-10-05", name: "대체공휴일(개천절)", isSubstitute: true },
  { date: "2026-10-09", name: "한글날", isSubstitute: false },
  { date: "2026-12-25", name: "성탄절", isSubstitute: false },
  { date: "2027-01-01", name: "신정", isSubstitute: false },
  { date: "2027-02-05", name: "설날 연휴", isSubstitute: false },
  { date: "2027-02-06", name: "설날 연휴", isSubstitute: false },
  { date: "2027-02-07", name: "설날 연휴", isSubstitute: false },
  { date: "2027-02-08", name: "대체공휴일(설날)", isSubstitute: true },
  { date: "2027-03-01", name: "삼일절", isSubstitute: false },
  { date: "2027-05-05", name: "어린이날", isSubstitute: false },
  { date: "2027-05-13", name: "부처님오신날", isSubstitute: false },
  { date: "2027-06-06", name: "현충일", isSubstitute: false }, // 일요일, 대체공휴일 없음
  { date: "2027-08-15", name: "광복절", isSubstitute: false },
  { date: "2027-08-16", name: "대체공휴일(광복절)", isSubstitute: true },
  { date: "2027-09-14", name: "추석 연휴", isSubstitute: false },
  { date: "2027-09-15", name: "추석 연휴", isSubstitute: false },
  { date: "2027-09-16", name: "추석 연휴", isSubstitute: false },
  { date: "2027-10-03", name: "개천절", isSubstitute: false },
  { date: "2027-10-04", name: "대체공휴일(개천절)", isSubstitute: true },
  { date: "2027-10-09", name: "한글날", isSubstitute: false },
  { date: "2027-10-11", name: "대체공휴일(한글날)", isSubstitute: true },
  { date: "2027-12-25", name: "성탄절", isSubstitute: false },
  { date: "2027-12-27", name: "대체공휴일(성탄절)", isSubstitute: true },
];
