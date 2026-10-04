🇺🇸 [한국어](./README.ko.md)

# Bridge Day Planner — Maximize your vacation with public holidays

A mini-app that calculates the longest consecutive vacation period you can take by combining remaining paid leave with Korean public holidays. Enter your remaining vacation days and instantly discover the optimal combination of dates from today through the end of 2027.

Designed for office workers aged 20–40 seeking to maximize their time off by strategically planning leave around public holidays (including substitute holidays).

## Features

- 📊 **Optimal vacation calculation** — Input remaining leave (1–25 days) to automatically find the longest possible consecutive break
- 📋 **Free tier results** — View 1st-ranked combination with dates and required leave days, efficiency top 3 (days off per leave day used), and countdown to next opportunity
- 📹 **Unlock with reward ad** — After watching a rewarded video, compare 2nd–5th ranked alternatives and view a month-by-month calendar
- 📅 **Interactive calendar** — Select different ranking options (1st–5th) to highlight corresponding vacation periods; color-coded by holiday type
- 💾 **Persistent input** — Last entered vacation days auto-saved to localStorage
- 🔄 **Error recovery** — Loading state with spinner and graceful error handling
- 📤 **Share results** — Built-in sharing to Toss messaging
- ♿ **Accessibility** — ARIA labels, 44×44px touch targets, dark mode support

## Tech Stack

- **Frontend:** React 18 + Vite 6.3
- **Routing:** React Router 7.5
- **UI:** Toss Design System (TDS Mobile), Emotion CSS-in-JS, Lucide React
- **Platform:** App-in-Toss SDK with rewarded ad support
- **Testing:** Vitest + Playwright visual regression
- **Language:** TypeScript 5.8

## Getting Started

### Installation
```bash
npm install
```

### Verification
```bash
# Type checking
npx tsc --noEmit

# Run unit tests
npx vitest run

# Visual regression testing
npm run test:visual
```

### Production Build
```bash
# Standard Vite production bundle
npm run build

# Apps-in-Toss deployment bundle
npx ait build
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_SHARE_OG_URL` | Preview image URL for shared links | No |
| `VITE_TOSS_AD_SLOT_ID` | Rewarded ad slot ID (from Toss console) | No |
| `VITE_TOSS_IAP_SKU` | In-app purchase SKU (from Toss console) | No |
| `VITE_TOSS_PROMOTION_CODE` | Promotion reward code (from Toss console) | No |

See `.env.example` for template. Empty values gracefully degrade features without breaking the app.

## Project Structure

```
src/
  pages/               # Page components
    Home.tsx          # Vacation input and navigation
    Result.tsx        # Results display and calendar
  lib/
    calculator.ts     # Vacation combination algorithm
    types.ts          # Shared TypeScript types
    storage.ts        # localStorage helpers
    analytics.ts      # Analytics wrapper
    review.ts         # Review request wrapper
    share.ts          # Sharing wrapper
    date.ts           # Date utilities
  data/
    holidays.ts       # Korean public holidays 2024–2027
  components/         # Pre-built component wrappers
e2e/
  visual-smoke.spec.ts # Visual regression tests
```

## Deployment

### Build & Test
1. `npm install`
2. `npx tsc --noEmit`
3. `npx vitest run`
4. `npm run test:visual`
5. `npm run build`

### Apps-in-Toss Deployment
1. `npx ait build` — Generate Toss-compatible bundle
2. Submit to Toss developer console
3. Verification checks: no console errors, CORS headers, dark mode support, safe area handling
4. After approval, deploys to Toss CDN automatically

## License

MIT
