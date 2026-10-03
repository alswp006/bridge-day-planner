import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter, useLocation } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import Result from "@/pages/Result";
import type { AppResult, Combo, RouteState } from "@/lib/types";

mockTds();
mockAppsInToss();

// 게이트 바깥/안쪽을 가르기 위한 표식 — 이 패킷의 요소는 전부 바깥이어야 한다.
vi.mock("@/components/TossRewardAd", () => ({
  TossRewardAd: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "reward-gate" }, children),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T09:00:00+09:00"));
});

// 2026-12-25(금) ~ 2027-01-03(일): 10일, 연차 4일
const first: Combo = {
  start: "2026-12-25",
  end: "2027-01-03",
  totalDays: 10,
  leaveDates: ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"],
  holidayNames: ["성탄절", "신정"],
  efficiency: 2.5,
  dday: 82,
};
// 2027-02-05(금) ~ 2027-02-09(화): 5일, 연차 1일
const second: Combo = {
  start: "2027-02-05",
  end: "2027-02-09",
  totalDays: 5,
  leaveDates: ["2027-02-09"],
  holidayNames: ["설날", "대체공휴일"],
  efficiency: 5,
  dday: 124,
};
// 2026-10-09(금) ~ 2026-10-12(월): 4일, 연차 1일 — 시작일이 가장 빠른 조합
const nearest: Combo = {
  start: "2026-10-09",
  end: "2026-10-12",
  totalDays: 4,
  leaveDates: ["2026-10-12"],
  holidayNames: ["한글날"],
  efficiency: 4,
  dday: 5,
};
// 2027-05-01(토) ~ 2027-05-05(수): 5일, 연차 2일
const third: Combo = {
  start: "2027-05-01",
  end: "2027-05-05",
  totalDays: 5,
  leaveDates: ["2027-05-03", "2027-05-04"],
  holidayNames: ["어린이날"],
  efficiency: 2.5,
  dday: 209,
};

const normal: AppResult = {
  ranked: [first, second],
  efficiencyTop: [second, nearest, third],
  nearest,
};
const empty: AppResult = { ranked: [], efficiencyTop: [], nearest: null };

function LocationProbe() {
  const loc = useLocation();
  return React.createElement("div", { "data-testid": "pathname" }, loc.pathname);
}

function renderResult(state?: unknown) {
  const router = createMemoryRouter(
    [
      { path: "/", element: React.createElement("div", null, React.createElement(LocationProbe), "HOME") },
      {
        path: "/result",
        element: React.createElement("div", null, React.createElement(LocationProbe), React.createElement(Result)),
      },
    ],
    { initialEntries: [{ pathname: "/result", state: state ?? null }] },
  );
  render(React.createElement(RouterProvider, { router }));
  return router;
}

const stateOf = (result: AppResult, leaveDays = 4): RouteState => ({
  result,
  input: { leaveDays, today: "2026-10-04" },
});

describe("Result Page: 무료 층 + 빈 상태", () => {
  it("AC-1[P0]: route state 없이 들어오면 빈 상태 A와 버튼이 보이고 SubmitFooter는 없다", () => {
    const router = renderResult();
    expect(screen.getByText("아직 계산한 연휴가 없어요")).toBeInTheDocument();
    expect(screen.queryByText("다시 계산하기")).toBeNull();
    expect(screen.queryByText("계산할 수 있는 연휴가 없어요")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "연차 입력하러 가기" }));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
  });

  it("AC-1[P0]: state 형태가 깨져 있어도 빈 상태 A로 간다(크래시 없음)", () => {
    renderResult({ foo: 1 });
    expect(screen.getByText("아직 계산한 연휴가 없어요")).toBeInTheDocument();
    expect(screen.queryByText("계산할 수 있는 연휴가 없어요")).toBeNull();
  });

  it("AC-2[P0]: ranked가 비면 빈 상태 B와 '다시 입력하기'가 보이고 버튼은 /로 이동한다", () => {
    const router = renderResult(stateOf(empty, 7));
    expect(screen.getByText("계산할 수 있는 연휴가 없어요")).toBeInTheDocument();
    expect(screen.queryByText("아직 계산한 연휴가 없어요")).toBeNull();
    expect(screen.queryByText("계산 중 문제가 생겼어요")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "다시 입력하기" }));
    expect(router.state.location.pathname).toBe("/");
  });

  it("AC-3[P0]: 1순위 기간·연속 일수·연차 날짜·D-day가 형식대로 표시된다", () => {
    renderResult(stateOf(normal));
    expect(screen.getAllByText("12월 25일(금) ~ 1월 3일(일)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10일").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("12/28(월), 12/29(화), 12/30(수), 12/31(목)")).toBeInTheDocument();
    expect(screen.getByText("D-82")).toBeInTheDocument();
  });

  it("AC-3: 오늘 시작하는 조합은 D-DAY로 표시된다", () => {
    const today: Combo = { ...nearest, start: "2026-10-04", dday: 0 };
    renderResult(stateOf({ ranked: [today], efficiencyTop: [today], nearest: today }));
    expect(screen.getAllByText("D-DAY").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("D-0")).toBeNull();
  });

  it("AC-4: 1순위 카드 아래에 연차 일수 안내 문구가 있다", () => {
    renderResult(stateOf(normal, 4));
    expect(screen.getByText("순위마다 연차 4일 안에서 따로 계산했어요")).toBeInTheDocument();
    expect(screen.getAllByText(/순위마다 연차/)).toHaveLength(1);
  });

  it("AC-5: 다음 연결 연휴 1행과 효율 TOP 3 행(3개)이 렌더링된다", () => {
    renderResult(stateOf(normal));
    expect(screen.getByText("다음 연결 연휴")).toBeInTheDocument();
    expect(screen.getByText("효율 TOP 3")).toBeInTheDocument();
    expect(screen.getAllByText("10월 9일(금) ~ 10월 12일(월)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("D-5")).toBeInTheDocument();
    expect(screen.getAllByText(/연차 1일당 \d+(\.\d)?일/)).toHaveLength(3);
    expect(screen.getAllByText("연차 1일당 2.5일").length).toBeGreaterThanOrEqual(1);
  });

  it("AC-6: 무료 층 요소는 TossRewardAd 바깥에 있고 숫자는 formatNumber를 거친다", () => {
    renderResult(stateOf(normal));
    const gate = screen.queryByTestId("reward-gate");
    for (const text of ["D-82", "D-5", "다음 연결 연휴", "효율 TOP 3", "순위마다 연차 4일 안에서 따로 계산했어요"]) {
      const el = screen.getByText(text);
      expect(el.closest('[data-testid="reward-gate"]')).toBeNull();
    }
    if (gate) expect(within(gate).queryByText("효율 TOP 3")).toBeNull();

    const src = readFileSync("src/pages/Result.tsx", "utf8");
    expect(src).toMatch(/formatNumber/);
    expect(src).not.toMatch(/\$\{\s*[\w.?]*(totalDays|efficiency|dday|leaveDays)\s*\}/);
  });

  it("AC-7[P0]: '다시 계산하기'를 탭하면 URL이 /가 된다", () => {
    const router = renderResult(stateOf(normal));
    fireEvent.click(screen.getByRole("button", { name: "다시 계산하기" }));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
  });
});
