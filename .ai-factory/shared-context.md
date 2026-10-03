# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
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

```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
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

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    MonthCalendar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  data/
    holidays.ts
  hooks/
  lib/
    analytics.ts
    calculator.test.ts
    calculator.ts
    contract.ts
    date.ts
    review.ts
    share.ts
    storage.ts
    types.ts
    utils.ts
  main.tsx
  pages/
    Home.tsx
    Result.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- analytics.ts: export type LogFields = Record<string, string | number | boolean | null>; export const DWELL_MS = 3000; export function fireAndForget(call: () => unknown): void; export function logScreen(page: string, extra?: LogFields): void; export function logClick(name: string, extra?: LogFields): void; export function logImpression(name: string, extra?: LogFields): void; export function useScreenLog(page: string): void
- calculator.ts: export function calculate( input: AppInput, holidays: Holiday[] | null | undefined, ): AppResult
- contract.ts: export type STORAGE_KEY_LAST_LEAVE = "bridge-day:lastLeave"; export type LEAVE_MIN = 1; export type LEAVE_MAX = 25; export type SEARCH_END = "2027-12-31"; export type HOLIDAY_DATA_LAST_YEAR = 2027; export type formatRangeFn = (from: Date, to: Date) => string; export type toMDFn = (date: Date) => string
- date.ts: export function toKey(d: Date): DateKey; export function parseKey(k: DateKey): Date; export function addDays(k: DateKey, n: number): DateKey; export function diffDays(a: DateKey, b: DateKey): number; export function weekdayKo(k: DateKey): string; export function isOffDay(k: DateKey, holidaySet: Set<DateKey>): boolean; export function formatRange(start: DateKey, end: DateKey): string; export function toMD(k: DateKey): string
- review.ts: export function requestReviewOnce(key: string = REVIEW_REQUESTED_KEY): void
- share.ts: export interface ShareAppOptions; export async function shareApp(opts: ShareAppOptions): Promise<void>
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type DateKey = string; export interface Holiday; export interface AppInput; export interface Combo; export interface AppResult; export interface RouteState; export const STORAGE_KEY_LAST_LEAVE = "bridge-day:lastLeave"; export const LEAVE_MIN = 1
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- MonthCalendar.tsx: MonthCalendar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd

### Module Dependencies (import graph)
  lib/calculator.ts → imports: lib/types, lib/types, lib/date, lib/date
  lib/date.ts → imports: lib/types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: Types & Constants + 공휴일 데이터 (files: src/lib/types.ts, src/data/holidays.ts)
- 0002: Core Logic: 날짜 유틸 + 연휴 계산기 (files: src/lib/date.ts, src/lib/calculator.ts)
- 0003: Core Logic 검증 (합성 fixture 테스트) (files: src/lib/calculator.test.ts)
- 0005: MonthCalendar 컴포넌트 (files: src/components/MonthCalendar.tsx)

## Available exports from existing files
// src/App.tsx
export default function App() {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/Card.tsx
export function Card({

// src/components/CountUp.tsx
export function CountUp({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export function FloatingTabBar({ items }: { items: TabItem[] }) {

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/MonthCalendar.tsx
export function MonthCalendar({ combos, selected, holidays }: MonthCalendarProps) {

// src/components/PageShell.tsx
export function PageShell({

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/Sparkline.tsx
export function Sparkline({

// src/components/StateView.tsx
export function EmptyState({
export function LoadingState({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function TossPurchase({

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/data/holidays.ts
export const HOLIDAY_DATA_LAST_YEAR = 2027;
export const HOLIDAYS: Holiday[] = [

// src/lib/analytics.ts
export type LogFields = Record<string, string | number | boolean | null>;
export const DWELL_MS = 3000;
export function fireAndForget(call: () => unknown): void {
export function logScreen(page: string, extra?: LogFields): void {
export function logClick(name: string, extra?: LogFields): void {
export function logImpression(name: string, extra?: LogFields): void {
export function useScreenLog(page: string): void {

// src/lib/calculator.ts
export {
export function calculate(

// src/lib/contract.ts
export type STORAGE_KEY_LAST_LEAVE = "bridge-day:lastLeave";
export type LEAVE_MIN = 1;
export type LEAVE_MAX = 25;
export

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(4), general(14), testing(2), ui(3)

Key lessons (verify against actual code before applying):
- [general] 진입점 라우터 배선은 맨 끝에 두지 말고 기반 패킷 직후 플레이스홀더 페이지와 함께 먼저 병합하라. 화면 패킷은 그 플레이스홀더를 교체하게 해서, 언제 중단돼도 병합된 화면에 도달할 수 있게 하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 파일 생성 전 디렉토리 구조 확인 — mkdir -p로 경로 보장 (60% · 타 앱 1회 — 맹신 금지)
- [general] 화면·라우팅 등 소비자 모듈은 그것이 import하는 생산자 모듈이 병합된 뒤에만 병합하고, 순서를 지킬 수 없으면 소비자 병합과 동시에 최소 플레이스홀더를 만들어 매 병합 직후 타입체크와 빌드가 항상 통과하도록 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 전역 라우팅·탭바·Provider 배선은 개별 화면보다 먼저(초반 20% 안에) 완료하고 미구현 화면은 스텁 라우트로 연결해, 시간 예산이 소진돼도 앱이 항상 실행 가능한 상태를 유지하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 저장·데이터 접근 등 기반 계층 패킷은 이를 import 하는 화면 패킷보다 반드시 먼저 완료·병합하고, 미완료면 상위 화면 패킷 병합을 차단하라 — 빈 기반 모듈 하나가 전 라우트 스모크를 무너뜨린다. (60% · 타 앱 1회 — 맹신 금지)