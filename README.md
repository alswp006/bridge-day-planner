# Bridge Day Planner

앱 이름: 징검다리 연휴 / Bridge Day Planner > **이번 보완 내용**: 기존 내용은 그대로 두고 AC 8개를 추가했습니다(**[추가]** 표시). 추가한 AC는 Task의 Covers와 DoD에도 반영했습니다. 마지막의 "보완 근거"에 시뮬레이션 내용 중 반영한 것과 반영하지 않은 것을 정리했습니다. - **한줄 요약**: 남은 연차 일수를 넣으면 오늘부터 2027년 말까지의 공휴일(대체공휴일 포함)을 기준으로, 가장 길게 이어서 쉴 수 있는 날짜 조합을 찾아 줍니다.

## Tech Stack

- React 18.0.0
- TypeScript
- Vitest

## Routes

| Path | Description |
|------|-------------|
| `/Home` | Home |
| `/Result` | Result |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Development

```bash
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm build        # Production build
```

## Design Documents

See `.ai-factory/` directory for full design artifacts:
- `prd.md` — Product Requirements Document
- `spec.md` — Technical Specification
- `task.md` — Epic/Task Breakdown

---
Built with [AI Factory](https://github.com/alswp006/ai-factory) · Last synced: 2026-10-03
