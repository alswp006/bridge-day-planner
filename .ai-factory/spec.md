# Bridge Day Planner (bridge-day-planner)
앱 이름: 징검다리 연휴 / Bridge Day Planner

> **이번 보완 내용**: 기존 내용은 그대로 두고 AC 8개를 추가했습니다(**[추가]** 표시). 추가한 AC는 Task의 Covers와 DoD에도 반영했습니다. 마지막의 "보완 근거"에 시뮬레이션 내용 중 반영한 것과 반영하지 않은 것을 정리했습니다.

## Mini-PRD
- **한줄 요약**: 남은 연차 일수를 넣으면 오늘부터 2027년 말까지의 공휴일(대체공휴일 포함)을 기준으로, 가장 길게 이어서 쉴 수 있는 날짜 조합을 찾아 줍니다.
- **문제**: 공휴일 앞뒤에 연차를 붙여 길게 쉬려면 지금은 달력 앱을 넘기며 손으로 세어야 합니다. 대체공휴일까지 겹치면 어느 달에 연차를 쓰는 게 이득인지 한눈에 비교하기 어렵습니다.
- **목표**: 연차 일수 1개만 입력하면 1초 안에 1순위 연휴 조합(기간, 연속 휴일 일수, 연차 쓸 날짜)을 보여 줍니다.
- **타겟 유저**: 20~40대 직장인 중 남은 연차로 연휴를 최대한 길게 이어 쉬고 싶은 사람
- **핵심 기능** (최대 3개):
  1. 남은 연차 일수(1~25)를 입력하면 오늘~2027-12-31 구간에서 연속 휴일이 가장 긴 조합을 자동으로 계산
  2. 무료 층: 1순위 조합(기간, 연속 휴일 일수, 연차 쓸 날짜), 연차 1일당 효율 TOP 3, 다음 연결 연휴까지 D-day
  3. 잠금 층(리워드 광고를 본 뒤 열림): 2~5순위 조합 비교, 월별 달력에서 쉬는 구간 표시
- **비목표**:
  - 회사별 휴무일(창립기념일 등)이나 사용자가 직접 추가하는 휴일은 반영하지 않습니다. 법정 공휴일과 대체공휴일만 반영합니다.
  - 연차를 실제로 신청하거나 캘린더에 등록하거나 알림을 보내지 않습니다.
  - 순위마다 연차를 따로 계산합니다. 연차를 여러 조합에 나눠 쓰는 계획(예: 3일 + 2일)은 짜지 않습니다.
- **수익 모델**: 리워드 광고로 더 깊은 층을 잠급니다. 배너는 두지 않습니다(MicroPlanning 결정).
  - 리워드 광고: DAU 15 × 0.2회 × 30일 × (30,128 ÷ 1000) × 0.85 ≈ **월 2,305원**
  - 근거: 출시 직후 실측 기저선 DAU 15명. 외부 채널이나 기존 트래픽 근거가 없어 더 큰 DAU는 가정하지 않았습니다.

## SPEC

### F1: 연차 입력 및 최장 연휴 조합 계산
- AC-1-1: [U] Home에는 TextField(`inputMode="numeric"`)가 1개 있고, 1 이상 25 이하의 정수만 통과합니다. 소수(예: `2.5`)나 숫자 아닌 문자는 통과하지 못합니다.
- AC-1-2: [E] When 사용자가 "최장 연휴 찾기" 버튼을 탭하면, 시스템은 계산 결과를 `navigate('/result', { state })`로 넘기고 입력값을 localStorage `bridge-day:lastLeave`에 저장합니다.
- AC-1-3: [E] When Home에 다시 들어오면, `bridge-day:lastLeave` 값이 TextField에 미리 채워져 있습니다. 값이 없거나 1~25 정수가 아니면 빈칸으로 둡니다.
- AC-1-4: [U] 탐색 구간은 오늘(기기 로컬 날짜)부터 2027-12-31까지입니다. 휴무일은 토·일과 `holidays.ts`에 있는 날짜입니다. 연차를 써야 하는 날은 그 밖의 월~금입니다.
- AC-1-5: [U] 후보 조합은 다음 네 조건을 모두 만족해야 합니다.
  - (a) 연차를 1일 이상 N일 이하로 씁니다.
  - (b) 공휴일(대체공휴일 포함)이 1일 이상 들어 있습니다.
  - (c) 시작일의 전날과 종료일의 다음 날이 근무일이거나 탐색 구간의 경계입니다. 즉 붙어 있는 휴무일은 끝까지 포함합니다.
  - (d) 시작일이 오늘 이후입니다.
- AC-1-6: [U] 순위는 연속 일수 내림차순, 같으면 연차 사용일 오름차순, 같으면 시작일 오름차순으로 정합니다. 앞 순위와 하루라도 겹치는 후보는 빼고 최대 5개까지 뽑습니다.
- AC-1-7: [W] If 오늘이 공휴일 데이터의 마지막 연도(2027년)를 지났거나 후보가 0개이면, 시스템은 Result에 "계산할 수 있는 연휴가 없어요" 빈 상태와 "다시 입력하기" 버튼을 보여 줍니다.
- AC-1-8: [U] `holidays.ts`의 모든 항목에는 `date`, `name`, `isSubstitute`가 있습니다. 파일 상단 주석에 출처(한국천문연구원 특일정보, 관공서의 공휴일에 관한 규정)와 검증 일자가 있습니다. 아래 "공휴일 데이터 초안"의 [검증 필요] 항목을 모두 확인하기 전에는 이 AC가 통과하지 않습니다.
- **AC-1-9 [추가]**: [U] AC-1-5(d)의 "오늘 이후"에는 오늘이 포함됩니다(시작일 ≥ 오늘). 오늘이 휴무일 연속 구간의 중간이면 구간을 오늘에서 자릅니다. 이때 시작일은 오늘이고(AC-1-5(c)의 경계 규칙), 연속 일수도 오늘부터 세며, `dday = 0`이어서 `D-DAY`로 표시합니다.
  - 검증: 합성 fixture에서 오늘 = 일요일이고 전날(토)이 공휴일일 때, 그 연휴 구간 후보의 `start`가 오늘이고 `dday`가 0입니다.

### F2: 무료 결과(핵심 답, 게이트 바깥)
- AC-2-1: [U] 1순위 카드에는 다음이 표시됩니다.
  - 기간: `M월 D일(요일) ~ M월 D일(요일)` 형식
  - 연속 휴일: `N일`
  - 연차 사용: `N일`과 연차 쓸 날짜 목록(`M/D(요일)`, 쉼표로 구분)
- AC-2-2: [U] 효율은 연속 일수 ÷ 연차 사용일이며, 소수 첫째 자리까지 반올림해 "연차 1일당 X.X일"로 표시합니다. 효율 TOP 3는 효율 내림차순, 같으면 연속 일수 내림차순, 같으면 시작일 오름차순으로 정렬하고, 서로 겹치지 않는 3개(후보가 적으면 있는 만큼)를 ListRow로 표시합니다.
- AC-2-3: [U] D-day는 두 가지를 표시합니다.
  - 1순위 시작일까지의 D-day
  - "다음 연결 연휴": 전체 후보 중 시작일이 가장 빠른 조합의 기간과 D-day
  - 표기 규칙: 오늘 기준 `D-n`, 오늘 시작이면 `D-DAY`
- AC-2-4: [U] F2의 모든 요소(1순위 카드, 효율 TOP 3, D-day)는 광고를 보지 않아도 보입니다. 즉 TossRewardAd 바깥에 렌더링합니다.
- AC-2-5: [U] 1순위 카드 아래에 "순위마다 연차 N일 안에서 따로 계산했어요" 안내 문구(Paragraph.Text)가 1줄 있습니다.
- **AC-2-6 [추가]**: [U] 효율 TOP 3의 후보 풀과 정렬 기준은 다음과 같습니다.
  - 후보 풀은 AC-1-5를 통과한 **전체 후보**입니다. 1~5순위(`ranked`)로 제한하지 않고, `ranked`의 조합과 겹쳐도 됩니다. "서로 겹치지 않음"은 TOP 3끼리만 적용합니다.
  - 정렬할 때는 **반올림 전** 값(`totalDays / leaveDates.length`)을 비교합니다. 소수 1자리 반올림은 표시와 `Combo.efficiency` 저장에만 씁니다.
  - 검증: 반올림 전 효율이 2.34와 2.26인 두 후보는 둘 다 "2.3"으로 표시되지만, 2.34인 후보가 앞에 옵니다.

### F3: 잠금 층(TossRewardAd 안쪽)
- AC-3-1: [E] When 리워드 광고 시청이 끝나면, 시스템은 2~5순위를 ListRow로 보여 줍니다. 각 행에는 순위, 기간, 연속 일수, 연차 사용일, 효율이 있습니다.
- AC-3-2: [U] 월별 달력의 요구 사항은 다음과 같습니다.
  - 1~5순위 구간이 걸친 월만 시간 순으로 표시합니다.
  - 7열 그리드이며 헤더는 일~토입니다.
  - 칸은 세 종류로 구분합니다: ① 공휴일·주말, ② 연차 쓸 날, ③ 선택한 순위의 연휴 구간. 색은 `vars.color` 토큰만 씁니다.
  - 범례 3개를 함께 표시합니다.
- AC-3-3: [E] When 달력 위 Chip 그룹에서 ChipItem(1위~5위)을 탭하면, 해당 순위 구간만 달력에 강조됩니다. 기본 선택은 1위입니다.
- AC-3-4: [W] If 2순위 후보가 없으면, 시스템은 TossRewardAd 게이트를 렌더링하지 않고 "다른 조합이 없어요" 문구만 보여 줍니다.
- AC-3-5: [W] If 광고를 불러오지 못하거나 사용자가 중간에 닫으면, 잠금 층은 그대로 잠겨 있고 F2의 무료 층은 바뀌지 않습니다.
- **AC-3-6 [추가]**: [U] `ranked.length >= 2`이고 잠금 층이 잠겨 있을 때, 게이트 바로 위(게이트 **바깥**)에 Paragraph.Text 1줄을 둡니다. 문구는 "광고를 보면 2~5순위 비교와 월별 달력을 볼 수 있어요"입니다. `ranked.length < 2`이면 이 문구는 렌더링하지 않습니다(AC-3-4 문구만 표시).
- **AC-3-7 [추가]**: [W] If `VITE_TOSS_AD_SLOT_ID`가 빌드 시점에 비어 있으면(콘솔에서 아직 발급받지 않은 경우), TossRewardAd 템플릿 동작대로 잠금 층이 광고 없이 바로 열립니다.
  - 이 빌드에서는 AC-3-5(잠김 유지)를 검증하지 않습니다. AC-3-5는 슬롯 ID를 넣고 **다시 빌드해 배포한** 빌드에서 검증합니다. Vite가 `import.meta.env.VITE_*` 값을 빌드 시점에 넣기 때문에, 값을 바꾸면 다시 빌드해야 합니다.
  - 잠금 층 코드에는 슬롯 ID가 없을 때를 위한 분기를 따로 두지 않습니다(템플릿 컴포넌트는 수정하지 않습니다).
- **AC-3-8 [추가]**: [S] While 잠금이 풀린 Result 화면에 머무는 동안에는 Chip을 탭하거나 다시 렌더링되어도 잠금 층이 다시 잠기지 않습니다. 잠금 해제 상태는 localStorage에 저장하지 않습니다. "다시 계산하기"를 눌러 새로 계산하고 `/result`에 다시 들어오면 잠금 층은 다시 잠겨 있습니다.

### 필수 AC (모든 QuickApp에 포함)
- AC-INPUT-1: [W] 입력이 비어 있으면 1차 버튼이 비활성화되고, SubmitFooter hint에 "남은 연차 일수를 입력해 주세요"가 표시됩니다. TextField의 `hasError`는 사용자가 한 번 입력을 건드린 뒤에만 켭니다(첫 화면부터 빨간 칸 금지).
- AC-INPUT-2: [W] 0 이하, 25 초과, 정수가 아닌 값을 넣으면 help에 "1~25 사이 정수로 입력해 주세요"를 표시하고 버튼을 비활성화합니다.
- AC-EMPTY: [S] Home에 처음 들어오면(저장값 없음) TDS Pattern E 빈 상태가 보입니다. 내용은 "연차 며칠 남았나요?"와 설명 1줄입니다. Result에 route state 없이 직접 들어오면 빈 상태와 "연차 입력하러 가기" 버튼이 보입니다.
- AC-LOADING: [S] 계산 중에는 Spinner를 보여 줍니다. 계산은 `setTimeout(0)` 뒤에 실행해 Spinner가 최소 1프레임은 렌더링되게 합니다.
- AC-ERROR: [W] 계산 중 예외가 나면 "계산 중 문제가 생겼어요" 메시지와 "다시 시도" 버튼을 보여 줍니다. 버튼을 누르면 같은 입력으로 다시 계산합니다. 예외는 console.error로 남기지 않습니다.
- AC-A11Y-1: [U] 모든 Button과 TextField에 aria-label이 있습니다. 예: `aria-label="남은 연차 일수"`.
- AC-A11Y-2: [U] 모든 터치 타겟은 44×44px 이상입니다. 달력 칸은 탭 대상이 아니고, ChipItem은 TDS 기본값을 씁니다.
- AC-A11Y-3: [U] 색은 `vars.color` 토큰만 씁니다. HEX/RGB 하드코딩은 0개입니다(다크 모드 대응).
- AC-REWARD: [E] 2~5순위 비교와 월별 달력만 TossRewardAd로 감쌉니다. 1순위, 효율 TOP 3, D-day는 게이트 바깥(무료)에 둡니다.
- AC-FORMAT: [U] 일수, 효율, D-day 숫자는 formatNumber로 출력합니다.
- AC-REVIEW-1: [W] 외부 도메인으로 나가는 링크(outlink)는 0개입니다.
- AC-REVIEW-2: [U] 정상 흐름과 오류 흐름 모두에서 console.error는 0개입니다.
- AC-REVIEW-3: [W] GA, Amplitude 등 외부 로깅 SDK import는 0개입니다.
- AC-KEYBOARD: [E] When TextField에 포커스가 가면, 시스템은 1차 버튼(하단 고정)이 키보드 위에 보이도록 `scrollIntoView({ block: 'center' })`를 실행합니다.
- **AC-STORAGE-FAIL [추가]**: [W] If localStorage 접근이 예외를 던지면(QuotaExceededError, SecurityError 등), 시스템은 그 예외를 삼킵니다.
  - **쓰기 실패**: 계산과 `navigate('/result')`는 그대로 진행합니다. 오류 UI와 console.error는 모두 0개입니다.
  - **읽기 실패**: AC-1-3의 "값 없음"과 똑같이 TextField를 빈칸으로 두고 AC-EMPTY 빈 상태를 보여 줍니다.
  - 검증: `Storage.prototype.setItem`과 `getItem`을 throw하도록 mock했을 때, 15를 입력하고 탭하면 `/result`에 도착하고 console.error는 0건입니다.
- **AC-CALC-DATA [추가]**: [W] If `calculate(input, holidays)`에 들어온 `holidays`가 `undefined`, `null`, 빈 배열 중 하나이면, 예외 없이 `{ ranked: [], efficiencyTop: [], nearest: null }`을 반환합니다. Result에는 AC-ERROR 화면이 아니라 AC-1-7 빈 상태("계산할 수 있는 연휴가 없어요")가 보입니다.
- **AC-LOADING-2 [추가]**: [E] When 계산 중(Spinner 표시 중)에 사용자가 1차 버튼을 다시 탭하면, 시스템은 무시합니다.
  - 계산 중에는 1차 버튼이 `loading` 또는 `disabled` 상태이고, TextField는 `disabled`입니다.
  - 검증: 버튼을 빠르게 2번 탭하면 `calculate` 호출은 1회이고, history 항목도 1개만 늘어납니다.

### 공휴일 데이터 초안 (`src/data/holidays.ts`) — 전 항목 [검증 필요]
| 날짜 | 이름 | 대체 |
|---|---|---|
| 2026-10-03(토) | 개천절 | |
| 2026-10-05(월) | 대체공휴일(개천절) | ✓ |
| 2026-10-09(금) | 한글날 | |
| 2026-12-25(금) | 성탄절 | |
| 2027-01-01(금) | 신정 | |
| 2027-02-05(금)~02-07(일) | 설날 연휴 | |
| 2027-02-08(월) | 대체공휴일(설날) | ✓ |
| 2027-03-01(월) | 삼일절 | |
| 2027-05-05(수) | 어린이날 | |
| 2027-05-13(목) | 부처님오신날 | |
| 2027-06-06(일) | 현충일 (대체 없음) | |
| 2027-08-15(일) / 08-16(월) | 광복절 / 대체공휴일 | 08-16 ✓ |
| 2027-09-14(화)~09-16(목) | 추석 연휴 | |
| 2027-10-03(일) / 10-04(월) | 개천절 / 대체공휴일 | 10-04 ✓ |
| 2027-10-09(토) / 10-11(월) | 한글날 / 대체공휴일 | 10-11 ✓ |
| 2027-12-25(토) / 12-27(월) | 성탄절 / 대체공휴일 | 12-27 ✓ |

**미결 사항** (확인 전에는 데이터에서 뺍니다):
- 제헌절(7/17)이 공휴일로 다시 지정됐는지
- 노동절(5/1)이 관공서 공휴일인지
- 2027년에 임시공휴일이 지정됐는지

### Screen Definitions

#### Home (/)
- Top: "징검다리 연휴"
- 저장값이 없을 때(또는 저장소 읽기 실패 시 **[추가]**): 빈 상태(Pattern E)
- 구성: TextField "남은 연차 일수"(suffix "일") → 하단 고정 Button "최장 연휴 찾기"
- 상태: 초기(빈 입력), 입력 중, 검증 오류, 계산 중(Spinner, 버튼 loading·TextField disabled **[추가]**), 계산 오류(재시도)
- 네비게이션: 계산이 끝나면 `/result`로 이동하며 `state: RouteState`를 넘깁니다.

#### Result (/result)
- 무료 층(순서대로):
  1. 1순위 카드(기간, 연속 N일, 연차 날짜, D-day)
  2. 안내 문구 1줄
  3. "다음 연결 연휴" ListRow(D-day)
  4. "효율 TOP 3" ListRow ×3
- 잠금 안내 문구 1줄(게이트 바깥, `ranked.length >= 2`일 때만) **[추가]**
- 잠금 층: `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>` 안에 2~5순위 ListRow, Chip 그룹(1~5위), MonthCalendar
- 상태: route state 없음(빈 상태), 후보 0개(AC-1-7), 광고 대기, 잠금 해제됨
- 하단: Button "다시 계산하기" → `/`

### Data Model
```typescript
// src/lib/types.ts
type DateKey = string; // 'YYYY-MM-DD' (로컬 날짜, 타임존 변환 금지)

interface Holiday { date: DateKey; name: string; isSubstitute: boolean; }

interface AppInput { leaveDays: number; today: DateKey; } // 1~25 정수

interface Combo {
  start: DateKey; end: DateKey;
  totalDays: number;          // 연속 휴일 일수
  leaveDates: DateKey[];      // 연차 써야 하는 날 (length = 연차 사용일)
  holidayNames: string[];     // 구간에 들어 있는 공휴일 이름
  efficiency: number;         // totalDays / leaveDates.length, 소수 1자리 반올림 (정렬은 반올림 전 값 — AC-2-6)
  dday: number;               // start - today (0 = D-DAY)
}

interface AppResult {
  ranked: Combo[];            // 길이순 최대 5개, 서로 겹치지 않음
  efficiencyTop: Combo[];     // 효율순 최대 3개, 서로 겹치지 않음 (풀 = 전체 후보)
  nearest: Combo | null;      // 전체 후보 중 시작일이 가장 빠른 조합
}

// Route state (react-router useNavigate)
interface RouteState { result: AppResult; input: AppInput; }
```

## TASK

### Epic 1: Data Layer
- **Task 1: 타입 정의**
  - Files: `src/lib/types.ts`
  - Covers: AC-1-4 (DateKey 규약)
  - DoD: 위 Data Model이 그대로 export되고 `tsc --noEmit`이 통과합니다.
- **Task 2: 공휴일 데이터**
  - Files: `src/data/holidays.ts`
  - Covers: AC-1-8
  - DoD:
    - 초안 표의 모든 날짜가 `Holiday[]`로 들어 있습니다.
    - 상단 주석에 출처와 검증 일자가 있습니다.
    - 미결 사항 3개는 TODO 주석으로 남깁니다.
    - `HOLIDAY_DATA_LAST_YEAR = 2027`을 export합니다.
- **Task 3: 날짜 유틸**
  - Files: `src/lib/date.ts`
  - Covers: AC-1-4, AC-2-1, AC-2-3
  - DoD:
    - `toKey`, `parseKey`, `addDays`, `diffDays`, `weekdayKo`, `isOffDay(key, holidaySet)`, `formatRange(start, end)`를 구현합니다. 출력 형식은 "10월 9일(금) ~ 10월 11일(일)"입니다.
    - 모든 계산은 로컬 날짜(`new Date(y, m-1, d)`)로 하며 UTC 변환을 쓰지 않습니다.
- **Task 4: 계산 로직(순수 함수)**
  - Files: `src/lib/calculator.ts`
  - Covers: AC-1-5, AC-1-6, AC-1-7, AC-2-2, AC-2-3, **AC-1-9, AC-2-6, AC-CALC-DATA [추가]**
  - DoD:
    - `calculate(input, holidays): AppResult`는 오늘부터 12/31까지 O(n²) 이하로 후보를 열거한 뒤 AC-1-5 조건으로 거릅니다.
    - 정렬과 겹침 제외는 AC-1-6과 AC-2-2를 따르고, `nearest`는 AC-2-3을 따릅니다.
    - 오늘이 데이터 마지막 연도를 지났거나 후보가 0개면 `ranked: []`를 반환합니다.
    - **[추가]** 함수 첫 줄에서 `holidays`가 없거나 빈 배열인지 확인하고, 해당하면 빈 결과(`ranked: []`, `efficiencyTop: []`, `nearest: null`)를 반환합니다. 예외는 던지지 않습니다.
    - **[추가]** 시작일은 오늘 이상입니다. 오늘이 휴무 구간 중간이면 오늘을 경계로 자릅니다.
    - **[추가]** `efficiencyTop`은 전체 후보에서 반올림 전 효율로 정렬해 뽑습니다.
- **Task 5: 계산 로직 검증**
  - Files: `src/lib/calculator.test.ts` (vitest가 없으면 `scripts/verify-calculator.ts`)
  - Covers: AC-1-5, AC-1-6, AC-2-2, **AC-1-9, AC-2-6, AC-CALC-DATA [추가]**
  - DoD: 실제 데이터가 아닌 합성 공휴일 fixture로 아래 케이스가 모두 통과합니다.
    - ① 수요일 공휴일 1개 + N=2 → 최장 조합이 토~일 5일 이상
    - ② 공휴일 없는 구간은 후보에서 제외
    - ③ 연차 0일 조합은 제외
    - ④ 겹치는 조합은 하나만 순위에 포함
    - ⑤ 효율은 소수 1자리로 반올림
    - **[추가]** ⑥ `holidays`가 `[]`, `undefined`, `null`이면 예외 없이 `ranked.length === 0`이고 `nearest === null`
    - **[추가]** ⑦ 오늘 = 일요일이고 전날(토)이 공휴일 → 그 구간 후보의 `start === today`, `dday === 0`
    - **[추가]** ⑧ 반올림 전 효율 2.34와 2.26 후보가 있으면 `efficiencyTop`에서 2.34가 먼저 오고, `ranked`에 없는 후보도 `efficiencyTop`에 들어올 수 있음

### Epic 2: Pages & Components
- **Task 6: Home 화면**
  - Files: `src/pages/Home.tsx`
  - Covers: AC-1-1, AC-1-2, AC-1-3, AC-INPUT-1, AC-INPUT-2, AC-EMPTY, AC-LOADING, AC-ERROR, AC-KEYBOARD, AC-A11Y-1, **AC-STORAGE-FAIL, AC-LOADING-2 [추가]**
  - DoD:
    - TDS Top, TextField, Button과 storage.ts만 씁니다.
    - 유효하지 않은 입력에서는 버튼이 비활성화되고 hint/help가 표시됩니다.
    - 계산 중에는 Spinner, 예외가 나면 재시도 버튼을 보여 줍니다.
    - 버튼을 탭하면 `/result`로 이동하고 저장소에 입력값이 저장됩니다.
    - **[추가]** storage.ts 호출(읽기와 쓰기)을 try-catch로 감쌉니다. 템플릿 헬퍼가 이미 예외를 삼킨다면 그대로 둡니다. catch 블록은 비워 두고 console 출력은 하지 않습니다.
    - **[추가]** 계산 중 상태를 플래그(`isCalculating`)로 관리합니다. 플래그가 켜져 있으면 버튼 탭을 무시하고, 버튼은 `loading`(또는 `disabled`), TextField는 `disabled`로 둡니다.
- **Task 7: Result 무료 층**
  - Files: `src/pages/Result.tsx`
  - Covers: AC-2-1, AC-2-3, AC-2-4, AC-2-5, AC-1-7, AC-EMPTY, AC-FORMAT
  - DoD:
    - route state가 없으면 빈 상태를 보여 줍니다.
    - 1순위 카드, 다음 연결 연휴, 효율 TOP 3이 게이트 바깥에 렌더링됩니다.
    - 숫자는 모두 formatNumber를 거칩니다.
    - "다시 계산하기"를 누르면 `/`로 이동합니다.
- **Task 8: 월별 달력 컴포넌트**
  - Files: `src/components/MonthCalendar.tsx`
  - Covers: AC-3-2, AC-A11Y-3
  - DoD:
    - props는 `{ combos: Combo[]; selected: number; holidays: Holiday[] }`입니다.
    - 걸친 월만 7열 CSS grid로 그립니다(레이아웃 용도의 커스텀 CSS만 허용).
    - 색은 `vars.color` 토큰 3종을 쓰고 범례를 함께 표시합니다. HEX는 0개입니다.
- **Task 9: Result 잠금 층**
  - Files: `src/pages/Result.tsx` (섹션 추가)
  - Covers: AC-3-1, AC-3-3, AC-3-4, AC-3-5, AC-REWARD, **AC-3-6, AC-3-7, AC-3-8 [추가]**
  - DoD:
    - `ranked.length >= 2`일 때만 `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>` 안에 2~5순위 ListRow, Chip+ChipItem(1~5위), MonthCalendar를 렌더링합니다.
    - 2순위가 없으면 "다른 조합이 없어요" 문구를 보여 줍니다.
    - 무료 층 코드는 바꾸지 않습니다.
    - **[추가]** 게이트 바로 위(바깥)에 잠금 안내 Paragraph.Text 1줄을 두며, `ranked.length >= 2`일 때만 렌더링합니다.
    - **[추가]** 선택된 Chip 상태(`selected`)는 TossRewardAd **안쪽** 자식 컴포넌트에서 관리합니다. 그래서 Chip을 탭해도 게이트 컴포넌트가 다시 마운트되지 않습니다. 잠금 해제 상태는 localStorage에 쓰지 않습니다.
    - **[추가]** 슬롯 ID가 없을 때를 위한 분기 코드는 0줄입니다. 슬롯 ID가 비어 있으면 템플릿 동작대로 바로 열리는 것을 확인하고, AC-3-5는 슬롯 ID를 넣고 다시 빌드한 빌드에서 확인합니다.

### Epic 3: Integration
- **Task 10: 라우팅과 검수 점검**
  - Files: `src/App.tsx`
  - Covers: AC-A11Y-2, AC-REVIEW-1, AC-REVIEW-2, AC-REVIEW-3, AC-A11Y-1
  - DoD:
    - `/`와 `/result` 라우트를 등록합니다.
    - 아래 검색 결과가 모두 0건입니다: `grep -r "console.error\|https://\|gtag\|amplitude" src`
    - 앱 제목은 "징검다리 연휴"입니다.
    - 빌드에 성공합니다.

## AC Coverage
- Total: **40개** (F1 9 · F2 6 · F3 8 · 필수 17)
- Covered: 40개 (100%)
- Uncovered: 0개
- 추가된 AC 8개와 담당 Task:
  - Task 4·5: AC-1-9, AC-2-6, AC-CALC-DATA
  - Task 6: AC-STORAGE-FAIL, AC-LOADING-2
  - Task 9: AC-3-6, AC-3-7, AC-3-8

---

## 보완 근거

**에러 경로 시뮬레이션에서 MISSING으로 나온 2개는 모두 반영했습니다.**
- **AC-STORAGE-FAIL**: 시뮬레이션에는 쓰기 실패만 있었는데, 읽기 실패(SecurityError)도 함께 넣었습니다.
- **AC-CALC-DATA**: 시뮬레이션은 이 검사를 Home.tsx에 두자고 했습니다. 저는 순수 함수인 `calculator.ts`로 옮겼습니다. 그래야 테스트 ⑥으로 검증할 수 있습니다.

**유저 여정 시뮬레이션은 결론이 "모든 AC 통과"였지만, 시뮬레이션이 스펙과 다르게 해석한 부분을 보면 스펙이 모호한 곳이 드러납니다. 그래서 AC 6개를 더 만들었습니다.**

| 시뮬레이션에서 나온 해석 | 드러난 모호함 | 추가한 AC |
|---|---|---|
| 계산 중 입력과 버튼이 disabled라고 가정함 | 스펙에 없어서 두 번 탭하면 두 번 이동할 수 있음 | AC-LOADING-2 |
| 효율 TOP 3를 "1~5순위 중에서" 고르고, 오름차순으로 표시함 | 후보 풀과 반올림 전후 정렬 기준이 정해지지 않음 | AC-2-6 |
| 기준일을 2026-10-04(일)로 계산함. 전날은 개천절이고 다음 날은 대체공휴일 | "오늘 이후"에 오늘이 들어가는지, 휴무 구간 중간에서 시작하는 경우가 정해지지 않음 | AC-1-9 |
| 잠금 층이 "스크롤 또는 터치"로 열린다고 모호하게 서술함 | 잠긴 상태에서 무엇을 보여 줄지 정해지지 않음 | AC-3-6 |
| 광고가 실패하면 항상 잠긴다고 서술함 | 슬롯 ID가 없는 빌드에서는 템플릿 게이트가 바로 열려서 AC-3-5와 충돌함 | AC-3-7 |
| 상태 목록에 "잠금 해제됨"만 있음 | 해제 상태를 언제까지 유지하는지 정해지지 않음 | AC-3-8 |

**유저 여정 시뮬레이션의 예시 결과 데이터는 쓰지 않았습니다.** 12월~1월 구간에 "대체공휴일(설날)"이 들어가 있는 등 계산이 맞지 않습니다. 계산 검증은 Task 5의 합성 fixture로 합니다.

공휴일 데이터는 여전히 전 항목이 **[검증 필요]**입니다. 확인하기 전에는 AC-1-8이 통과하지 않습니다.

claude.ai의 Canva 커넥터는 아직 인증되지 않아 이번 세션에서는 쓸 수 없습니다. 필요하면 claude.ai 커넥터 설정에서 연결해 주세요.