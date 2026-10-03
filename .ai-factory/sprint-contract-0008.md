# Sprint Contract — 패킷 0008
<!-- 파이프라인이 이 패킷을 위해 생성(순수 생성 콜) — 다른 패킷의 계약서가 아니다 -->

## Sprint Contract: Routing & Integration + 검수 점검

**작업 항목**
- src/App.tsx: react-router-dom v6 `<BrowserRouter>`, `<Routes>` 추가, Route 정의 ('/' → Home 컴포넌트, '/result' → Result 컴포넌트)
- src/pages/Home.tsx, src/pages/Result.tsx: 각 페이지 컴포넌트 최상단에 `<PageTitle>징검다리 연휴</PageTitle>` 또는 동등 제목 표시

**사용 타입**
- import { RouteState, AppResult, AppInput } from 'src/lib/types'
- 라우트 state 전달: navigate('/result', { state: { result, input } })로 Result에 데이터 전달

**검증 방법**
1. '/'와 '/result' 각각 브라우저에서 렌더링 확인
2. `grep -rn "console.error\|https://\|gtag\|amplitude" src` → 0건 (템플릿 매치는 보고)
3. 모든 페이지 상단 제목 텍스트 '징검다리 연휴' 시각적 확인
4. `grep -rn "aria-label" src/pages src/components | grep -E "Button|TextField|SubmitFooter"` → 각 요소 100% 커버
5. `grep -rn 'href="http\|openURL' src` → 0건, `grep -rn "import.*gtag\|import.*amplitude"` → 0건
6. `npm run build` 종료 코드 0, `git diff src/main.tsx` 출력 없음

**금지 사항**
- src/main.tsx 수정 금지
- 환경 변수나 SDK 의존성 추가 금지
- console 메서드 호출 금지
