🇺🇸 [한국어](./README.ko.md)

# Bridge Day Planner — Find your longest vacation window

Bridge Day Planner helps workers maximize their vacation time by automatically finding the longest consecutive holiday periods available from today through 2027. Input your remaining vacation days, and instantly discover the best times to take a long break by combining your days off with public holidays and weekends.

Built as a Toss mini-app for iOS/Android, this tool eliminates the need for manual calendar calculations and provides data-driven insights on which vacation windows offer the best value.

## Features

- 📅 **Vacation combo calculation** — Input remaining days (1–25) and instantly find the longest consecutive rest period through end of 2027, accounting for public holidays, substitution holidays, weekends, and your vacation days
- 🏆 **Ranked results** — View top 1 combo (free), with optional access to rankings 2–5 and monthly calendar views (behind a reward ad)
- ⚡ **Efficiency ranking** — See top 3 vacation windows ranked by ROI (continuous days ÷ vacation days used)
- ⏳ **D-day countdown** — Track days until your best vacation window and the next available combo
- 📆 **Interactive calendar** — Visualize rest periods month-by-month with filtering by rank (unlocked via reward ad)
- 💾 **Persistent input** — Last vacation input saved locally for quick recalculation

## Tech Stack

- **Framework**: React 18 + React Router v7 (Vite)
- **Design**: TDS Mobile (Toss Design System) components
- **Mobile**: App-in-Toss SDK + TDS Mobile AIT provider
- **Styling**: Emotion (CSS-in-JS)
- **Testing**: Vitest + Playwright (visual regression)
- **Language**: TypeScript

## Getting Started

### Install dependencies
```bash
npm install
```

### Build for production
```bash
npx vite build
```

Outputs a static bundle to `dist/`. No dynamic SSR — the app is client-side only.

### Build & deploy to Toss Apps-in-Toss
```bash
npx ait build
```

Then submit for review via the [Toss developer console](https://developer.toss.im).

### Local development (testing only)
```bash
npm run typecheck          # Type check
npx vitest run             # Unit tests
npm run test:visual        # Visual regression (Playwright)
```

Note: Dev server is not used for verification — build and visual tests are the gates.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TOSS_AD_SLOT_ID` | Reward ad slot ID from Toss console | No (feature disabled if empty) |
| `VITE_SHARE_OG_URL` | OG image URL for app sharing | No |

Copy `.env.example` to `.env` and fill in values from your Toss developer console.

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx              # Input form & calculation trigger
│   ├── Result.tsx            # Results display, locked layer, calendar
│   └── __TdsGallery.tsx       # Dev-only component gallery
├── components/
│   ├── ScreenScaffold.tsx     # Page shell with header/footer
│   ├── BottomCTA.tsx          # Fixed bottom CTA buttons
│   ├── Card.tsx               # Result card container
│   ├── SummaryHero.tsx        # Large hero number display
│   ├── MonthCalendar.tsx      # Month-by-month vacation calendar
│   ├── TossRewardAd.tsx       # Reward ad gate wrapper
│   └── StateView.tsx          # Empty & loading states
├── lib/
│   ├── calculator.ts          # Core algorithm (find best combos)
│   ├── date.ts                # Date utilities & formatting
│   ├── types.ts               # Shared type definitions
│   ├── analytics.ts           # Event logging (wrapped SDK)
│   ├── storage.ts             # localStorage helpers
│   └── utils.ts               # Format functions
├── data/
│   └── holidays.ts            # Korean public holidays 2024–2027
└── __tests__/
    ├── *.test.ts              # Unit tests
    └── __helpers__/           # Test utilities & mocks
```

## Deployment

1. **Build locally**:
   ```bash
   npx vite build
   ```

2. **Run checks** (auto-gated before deployment):
   - Type safety: `npx tsc --noEmit`
   - Unit tests: `npx vitest run`
   - Visual regression: `npm run test:visual`

3. **Submit via Toss console**:
   - Use `npx ait build` to create the app bundle
   - Upload via [Toss developer console](https://console.tossmini.com)
   - Pass review (19+ age gate, no external links, zero console errors)

4. **Live on Toss** — after approval, accessible via the apps-in-toss ecosystem

## License

MIT
