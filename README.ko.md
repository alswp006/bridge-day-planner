🇰🇷 [English](./README.md)

# 징검다리 연휴 — 공휴일과 연차를 조합한 최대 휴무 계산기

남은 연차를 한국 공휴일과 결합하여 가장 긴 연속 휴무 기간을 계산하는 미니앱입니다. 남은 휴무일을 입력하면 오늘부터 2027년 말까지의 기간 중 최적의 날짜 조합을 즉시 추천합니다.

공휴일(대체공휴일 포함)을 중심으로 연차를 전략적으로 계획하여 휴무를 극대화하려는 20대~40대 직장인을 위해 설계되었습니다.

## 기능

- 📊 **최적 연휴 계산** — 남은 연차(1~25일)를 입력하면 가능한 가장 긴 연속 휴무를 자동으로 찾음
- 📋 **무료 기본 결과** — 1순위 조합의 날짜, 필요 연차일, 효율 상위 3개(연차 1일당 휴무일) 및 다음 기회 카운트다운 표시
- 📹 **리워드 광고로 해금** — 보상형 영상 광고 시청 후 2순위~5순위 대안 비교 및 월별 캘린더 조회 가능
- 📅 **인터랙티브 캘린더** — 순위 선택(1순위~5순위)으로 해당 휴무 기간 하이라이트; 공휴일 종류별 색상 구분
- 💾 **지속적인 입력값 저장** — 마지막 입력 연차일을 localStorage에 자동 저장
- 🔄 **에러 복구** — 스피너가 있는 로딩 상태 및 우아한 에러 처리
- 📤 **결과 공유** — 토스 메시징으로 기본 공유 기능
- ♿ **접근성** — ARIA 라벨, 44×44px 터치 타겟, 다크모드 지원

## 기술 스택

- **프론트엔드:** React 18 + Vite 6.3
- **라우팅:** React Router 7.5
- **UI:** Toss Design System (TDS Mobile), Emotion CSS-in-JS, Lucide React
- **플랫폼:** App-in-Toss SDK 리워드 광고 지원
- **테스트:** Vitest + Playwright 비주얼 회귀 테스트
- **언어:** TypeScript 5.8

## 시작하기

### 설치
```bash
npm install
```

### 검증
```bash
# 타입 체크
npx tsc --noEmit

# 유닛 테스트 실행
npx vitest run

# 비주얼 회귀 테스트
npm run test:visual
```

### 프로덕션 빌드
```bash
# 표준 Vite 프로덕션 번들
npm run build

# 앱인토스 배포 번들
npx ait build
```

## 환경 변수

| 변수 | 설명 | 필수 |
|---|---|---|
| `VITE_SHARE_OG_URL` | 공유 링크 미리보기 이미지 URL | 아니오 |
| `VITE_TOSS_AD_SLOT_ID` | 리워드 광고 슬롯 ID (토스 콘솔에서 발급) | 아니오 |
| `VITE_TOSS_IAP_SKU` | 인앱 결제 SKU (토스 콘솔에서 발급) | 아니오 |
| `VITE_TOSS_PROMOTION_CODE` | 프로모션 보상 코드 (토스 콘솔에서 발급) | 아니오 |

`.env.example`에서 템플릿을 참고하세요. 빈 값은 앱을 깨지 않으면서 기능을 우아하게 축소합니다.

## 프로젝트 구조

```
src/
  pages/               # 페이지 컴포넌트
    Home.tsx          # 연휴 입력 및 네비게이션
    Result.tsx        # 결과 표시 및 캘린더
  lib/
    calculator.ts     # 휴무 조합 알고리즘
    types.ts          # 공유 TypeScript 타입
    storage.ts        # localStorage 헬퍼
    analytics.ts      # 분석 래퍼
    review.ts         # 리뷰 요청 래퍼
    share.ts          # 공유 래퍼
    date.ts           # 날짜 유틸리티
  data/
    holidays.ts       # 한국 공휴일 2024~2027
  components/         # 사전 구축된 컴포넌트 래퍼
e2e/
  visual-smoke.spec.ts # 비주얼 회귀 테스트
```

## 배포

### 빌드 및 테스트
1. `npm install`
2. `npx tsc --noEmit`
3. `npx vitest run`
4. `npm run test:visual`
5. `npm run build`

### 앱인토스 배포
1. `npx ait build` — 토스 호환 번들 생성
2. 토스 개발자 콘솔에 제출
3. 검증 확인: 콘솔 에러 없음, CORS 헤더, 다크모드 지원, Safe Area 처리
4. 승인 후 자동으로 토스 CDN에 배포

## 라이선스

MIT
