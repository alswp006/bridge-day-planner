import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import Result from "@/pages/Result";
import { formatNumber } from "@/lib/utils";
import type { AppResult, Combo, RouteState } from "@/lib/types";

mockTds();
mockAppsInToss();

const gateMounts = vi.hoisted(() => ({ count: 0 }));

// 게이트 안/밖을 가르는 표식 + 마운트 횟수 측정
vi.mock("@/components/TossRewardAd", () => ({
  TossRewardAd: ({ children }: { children?: React.ReactNode }) => {
    React.useEffect(() => {
      gateMounts.count += 1;
    }, []);
    return React.createElement("div", { "data-testid": "reward-gate" }, children);
  },
}));

beforeEach(() => {
  gateMounts.count = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T09:00:00+09:00"));
});

const first: Combo = {
  start: "2026-12-25",
  end: "2027-01-03",
  totalDays: 10,
  leaveDates: ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"],
  holidayNames: ["성탄절", "신정"],
  efficiency: 2.5,
  dday: 82,
};
const second: Combo = {
  start: "2027-02-05",
  end: "2027-02-09",
  totalDays: 5,
  leaveDates: ["2027-02-09"],
  holidayNames: ["설날", "대체공휴일"],
  efficiency: 5,
  dday: 124,
};
const third: Combo = {
  start: "2027-05-01",
  end: "2027-05-05",
  totalDays: 5,
  leaveDates: ["2027-05-03", "2027-05-04"],
  holidayNames: ["어린이날"],
  efficiency: 2.5,
  dday: 209,
};

const three: AppResult = { ranked: [first, second, third], efficiencyTop: [second, third, first], nearest: second };
const one: AppResult = { ranked: [first], efficiencyTop: [first], nearest: first };

const LOCK_TEXT = "광고를 보면 2~5순위 비교와 월별 달력을 볼 수 있어요";

function renderResult(result: AppResult) {
  const state: RouteState = { result, input: { leaveDays: 4, today: "2026-10-04" } };
  const router = createMemoryRouter(
    [
      { path: "/", element: React.createElement("div", null, "HOME") },
      { path: "/result", element: React.createElement(Result) },
    ],
    { initialEntries: [{ pathname: "/result", state }] },
  );
  render(React.createElement(RouterProvider, { router }));
}

const chips = (gate: HTMLElement) => Array.from(gate.querySelectorAll<HTMLElement>("button[aria-pressed]"));
const outlined = (key: string) => (screen.getByTestId(`day-${key}`) as HTMLElement).style.outline;

describe("Result Page: 리워드 잠금 층", () => {
  it("AC-1[P0]: ranked가 1개면 '다른 조합이 없어요'만 보이고 게이트·잠금 문구는 0개", () => {
    renderResult(one);
    expect(screen.getByText("다른 조합이 없어요")).toBeInTheDocument();
    expect(screen.queryAllByTestId("reward-gate")).toHaveLength(0);
    expect(screen.queryAllByText(LOCK_TEXT)).toHaveLength(0);
    expect(screen.queryByTestId("month-grid")).toBeNull();
  });

  it("AC-1[P0]: ranked가 2개 이상이면 '다른 조합이 없어요'는 없다", () => {
    renderResult(three);
    expect(screen.queryByText("다른 조합이 없어요")).toBeNull();
    expect(screen.getAllByTestId("reward-gate")).toHaveLength(1);
  });

  it("AC-2[P0]: 잠금 안내 문구는 1개이고 TossRewardAd 바깥, 바로 위에 있다", () => {
    renderResult(three);
    const texts = screen.getAllByText(LOCK_TEXT);
    expect(texts).toHaveLength(1);
    const gate = screen.getByTestId("reward-gate");
    expect(gate.contains(texts[0])).toBe(false);
    expect(texts[0].compareDocumentPosition(gate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("AC-3[P0]: 잠금 해제 시 ListRow가 ranked.length-1개이고 순위·기간·일수·연차·효율이 있다", () => {
    renderResult(three);
    const gate = screen.getByTestId("reward-gate");
    const rows = within(gate).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("2위");
    expect(rows[0].textContent).toContain("2월 5일(금) ~ 2월 9일(화)");
    expect(rows[0].textContent).toContain("5일");
    expect(rows[0].textContent).toContain("연차 1일");
    expect(rows[0].textContent).toContain(formatNumber(second.efficiency));
    expect(rows[1].textContent).toContain("3위");
    expect(rows[1].textContent).toContain("5월 1일");
    expect(rows[1].textContent).toContain("연차 2일");
  });

  it("AC-4[P0]: ChipItem은 ranked.length개, 기본 1위 선택, 탭하면 햅틱 후 달력 선택이 바뀐다", () => {
    renderResult(three);
    const gate = screen.getByTestId("reward-gate");
    const items = chips(gate);
    expect(items).toHaveLength(3);
    expect(items.map((c) => c.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(outlined("2026-12-25")).toContain("solid");
    expect(outlined("2027-02-05")).not.toContain("solid");

    fireEvent.click(items[1]);
    expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "tickWeak" });
    expect(chips(gate).map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect(outlined("2027-02-05")).toContain("solid");
    expect(outlined("2026-12-25")).not.toContain("solid");
  });

  it("AC-5[P0]: Chip을 눌러도 게이트는 다시 마운트되지 않고 localStorage 쓰기는 없다", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem");
    renderResult(three);
    const gate = screen.getByTestId("reward-gate");
    expect(gateMounts.count).toBe(1);
    fireEvent.click(chips(gate)[2]);
    fireEvent.click(chips(gate)[1]);
    expect(gateMounts.count).toBe(1);
    expect(screen.getByTestId("reward-gate")).toBe(gate);
    expect(setSpy).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it("AC-6[P0]: 게이트 안쪽에 1순위 카드·효율 TOP 3·D-day가 없고 무료 층은 바깥에 남는다", () => {
    renderResult(three);
    const gate = screen.getByTestId("reward-gate");
    expect(within(gate).queryByTestId("top-combo-card")).toBeNull();
    expect(within(gate).queryByText("효율 TOP 3")).toBeNull();
    expect(gate.textContent).not.toMatch(/D-\d+|D-DAY/);
    expect(screen.getByTestId("top-combo-card")).toBeInTheDocument();
    expect(gate.contains(screen.getByText("효율 TOP 3"))).toBe(false);
  });

  it("AC-7: Result.tsx에 slotId 빈 값 분기가 없고 env를 그대로 넘긴다", () => {
    const src = readFileSync("src/pages/Result.tsx", "utf8");
    expect(src).toContain("slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}");
    expect(src).not.toMatch(/if\s*\(\s*!\s*[\w.]*(slotId|SLOT_ID)/i);
    expect(src).not.toMatch(/(slotId|SLOT_ID)\s*(\?\?|\|\||&&|\?)/);
  });
});
