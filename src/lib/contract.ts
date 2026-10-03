/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** localStorage 키 (구현: 패킷 0001) */
export type STORAGE_KEY_LAST_LEAVE = "bridge-day:lastLeave";

/** 최소 연차 일수 (구현: 패킷 0001) */
export type LEAVE_MIN = 1;

/** 최대 연차 일수 (구현: 패킷 0001) */
export type LEAVE_MAX = 25;

/** 검색 범위 종료일 (구현: 패킷 0001) */
export type SEARCH_END = "2027-12-31";

/** 공휴일 데이터 최종 연도 (구현: 패킷 0001) */
export type HOLIDAY_DATA_LAST_YEAR = 2027;

/** 날짜 범위 포맷 (결과 페이지 표시용) (구현: 패킷 0002) */
export type formatRangeFn = (from: Date, to: Date) => string;

/** 날짜를 M월 D일 형식으로 포맷 (구현: 패킷 0002) */
export type toMDFn = (date: Date) => string;
