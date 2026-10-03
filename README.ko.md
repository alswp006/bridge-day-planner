🇰🇷 [English](./README.md)

# 징검다리 연휴 — 가장 긴 휴가 기간 찾기

징검다리 연휴는 근로자들이 남은 연차를 최대한 활용할 수 있도록 오늘부터 2027년까지의 가장 긴 연속 휴일 기간을 자동으로 찾아줍니다. 남은 연차 일수를 입력하면 공휴일, 대체휴일, 주말과 당신의 휴가를 조합하여 가장 긴 휴식 기간을 즉시 발견할 수 있습니다.

토스의 미니앱으로 iOS/Android에서 사용 가능하며, 수동 달력 계산의 번거로움을 없애고 휴가 기간별 효율성에 대한 데이터 기반 인사이트를 제공합니다.

## 기능

- 📅 **연휴 조합 계산** — 남은 연차(1~25일)를 입력하면 공휴일, 대체휴일, 주말, 연차를 고려하여 2027년 말까지 가장 긴 연속 휴식 기간을 즉시 찾습니다
- 🏆 **순위별 결과** — 최고 1위 조합 확인(무료), 2~5위 순위 및 월별 캘린더 보기 추가 해제 가능(리워드 광고 이용)
- ⚡ **효율성 순위** — 효율성 순위 상위 3개 휴가 기간 확인(연속 휴무일 ÷ 사용 연차)
- ⏳ **D-day 카운트다운** — 최고의 휴가 기간까지의 남은 일수와 다음 휴가 조합 추적
- 📆 **인터랙티브 캘린더** — 월별 휴식 기간을 시각적으로 표현하고 순위별 필터링(리워드 광고 해제 필요)
- 💾 **지속적인 입력 저장** — 마지막 연차 입력이 로컬에 저장되어 빠른 재계산 가능

## 기술 스택

- **프레임워크**: React 18 + React Router v7 (Vite)
- **디자인**: TDS Mobile (Toss Design System) 컴포넌트
- **모바일**: App-in-Toss SDK + TDS Mobile AIT 제공자
- **스타일링**: Emotion (CSS-in-JS)
- **테스트**: Vitest + Playwright (시각 회귀 테스트)
- **언어**: TypeScript

## 시작하기

### 의존성 설치
```bash
npm install
```

### 프로덕션 빌드
```bash
npx vite build
```

`dist/` 디렉토리에 정적 번들을 생성합니다. 동적 SSR은 지원하지 않으며 앱은 클라이언트 사이드 전용입니다.

### 토스 앱인토스에 빌드 및 배포
```bash
npx ait build
```

그 후 [토스 개발자 콘솔](https://developer.toss.im)을 통해 검수 신청합니다.

### 로컬 개발(테스트용)
```bash
npm run typecheck          # 타입 체크
npx vitest run             # 단위 테스트
npm run test:visual        # 시각 회귀 테스트 (Playwright)
```

참고: Dev 서버는 검증에 사용되지 않습니다 — 빌드 및 시각 테스트가 검증 게이트입니다.

## 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_TOSS_AD_SLOT_ID` | 토스 콘솔의 리워드 광고 슬롯 ID | 아니오(비어있으면 기능 비활성화) |
| `VITE_SHARE_OG_URL` | 앱 공유용 OG 이미지 URL | 아니오 |

`.env.example`을 `.env`로 복사하고 토스 개발자 콘솔의 값을 입력합니다.

## 프로젝트 구조

```
src/
├── pages/
│   ├── Home.tsx              # 입력 폼 & 계산 트리거
│   ├── Result.tsx            # 결과 표시, 잠금 레이어, 캘린더
│   └── __TdsGallery.tsx       # 개발용 컴포넌트 갤러리
├── components/
│   ├── ScreenScaffold.tsx     # 헤더/푸터가 있는 페이지 셸
│   ├── BottomCTA.tsx          # 고정 하단 CTA 버튼
│   ├── Card.tsx               # 결과 카드 컨테이너
│   ├── SummaryHero.tsx        # 큰 히어로 숫자 표시
│   ├── MonthCalendar.tsx      # 월별 연휴 캘린더
│   ├── TossRewardAd.tsx       # 리워드 광고 게이트 래퍼
│   └── StateView.tsx          # 빈 상태 및 로딩 상태
├── lib/
│   ├── calculator.ts          # 핵심 알고리즘(최고의 조합 찾기)
│   ├── date.ts                # 날짜 유틸리티 & 포맷팅
│   ├── types.ts               # 공유 타입 정의
│   ├── analytics.ts           # 이벤트 로깅(래핑된 SDK)
│   ├── storage.ts             # localStorage 헬퍼
│   └── utils.ts               # 포맷 함수
├── data/
│   └── holidays.ts            # 한국 공휴일 2024~2027
└── __tests__/
    ├── *.test.ts              # 단위 테스트
    └── __helpers__/           # 테스트 유틸리티 & 목
```

## 배포

1. **로컬 빌드**:
   ```bash
   npx vite build
   ```

2. **검사 실행**(배포 전 자동 게이트):
   - 타입 안전성: `npx tsc --noEmit`
   - 단위 테스트: `npx vitest run`
   - 시각 회귀: `npm run test:visual`

3. **토스 콘솔을 통해 신청**:
   - `npx ait build`로 앱 번들 생성
   - [토스 개발자 콘솔](https://console.tossmini.com)을 통해 업로드
   - 검수 통과(19세 이상 연령 제한, 외부 링크 없음, 콘솔 오류 0개)

4. **토스에서 라이브** — 승인 후 앱인토스 생태계를 통해 접근 가능

## 라이선스

MIT
