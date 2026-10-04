import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import {
  mockTds,
  mockAppsInToss,
  mockAnalytics,
  mockLogClick,
  mockRequestReviewOnce,
  mockShareApp,
} from "@/__tests__/__helpers__/mocks";
import Home from "@/pages/Home";
import Result from "@/pages/Result";
import type { AppResult, Combo, RouteState } from "@/lib/types";

mockTds();
mockAppsInToss();
mockAnalytics();

vi.mock("@/components/TossRewardAd", () => ({
  TossRewardAd: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-05T09:00:00+09:00"));
  mockLogClick.mockClear();
  mockRequestReviewOnce.mockClear();
  mockShareApp.mockClear();
});

const first: Combo = {
  start: "2026-12-25",
  end: "2027-01-03",
  totalDays: 10,
  leaveDates: ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"],
  holidayNames: ["성탄절", "신정"],
  efficiency: 2.5,
  dday: 81,
};
const normal: AppResult = { ranked: [first], efficiencyTop: [first], nearest: first };
const empty: AppResult = { ranked: [], efficiencyTop: [], nearest: null };
const stateOf = (result: AppResult): RouteState => ({ result, input: { leaveDays: 4, today: "2026-10-05" } });

function renderPage(path: "/" | "/result", state?: unknown) {
  const router = createMemoryRouter(
    [
      { path: "/", element: React.createElement(Home) },
      { path: "/result", element: React.createElement(Result) },
    ],
    { initialEntries: [{ pathname: path, state: state ?? null }] },
  );
  render(React.createElement(RouterProvider, { router }));
  return router;
}

const shareButtons = () => screen.queryAllByRole("button", { name: /공유/ });

describe("[개선] 행동 로그·리뷰·공유 2가지 추가", () => {
  it("AC-1[P0]: 결과가 나온 Result 화면에서 requestReviewOnce가 1번 호출된다", () => {
    renderPage("/result", stateOf(normal));
    expect(screen.getByText("1순위 최장 연휴")).toBeInTheDocument();
    expect(mockRequestReviewOnce).toHaveBeenCalledTimes(1);
  });

  it("AC-2[P0]: Home 진입 직후에는 requestReviewOnce를 부르지 않는다", () => {
    renderPage("/");
    expect(screen.getByText("연차 며칠 남았나요?")).toBeInTheDocument();
    expect(mockRequestReviewOnce).not.toHaveBeenCalled();
  });

  it("AC-2[P0]: 결과 없이 들어온 Result(빈 상태·빈 결과)에서도 호출하지 않는다", () => {
    renderPage("/result");
    expect(screen.getByText("아직 계산한 연휴가 없어요")).toBeInTheDocument();
    expect(mockRequestReviewOnce).not.toHaveBeenCalled();
    cleanup();
    renderPage("/result", stateOf(empty));
    expect(screen.getByText("계산할 수 있는 연휴가 없어요")).toBeInTheDocument();
    expect(mockRequestReviewOnce).not.toHaveBeenCalled();
  });

  it("AC-3[P0]: 결과 화면에 공유 버튼이 1개 있고 누르면 shareApp이 message와 함께 불린다", () => {
    renderPage("/result", stateOf(normal));
    const buttons = shareButtons();
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(mockShareApp).toHaveBeenCalledTimes(1);
    const arg = (mockShareApp.mock.calls[0] as unknown as [{ message: string }])[0];
    expect(typeof arg.message).toBe("string");
    expect(arg.message.length).toBeGreaterThan(0);
  });

  it("AC-3[P0]: 결과가 없는 빈 상태에는 공유 버튼이 없다", () => {
    renderPage("/result");
    expect(shareButtons()).toHaveLength(0);
    expect(mockShareApp).not.toHaveBeenCalled();
  });

  it("AC-4[P0]: 공유 버튼을 누르면 logClick('share_tap')이 shareApp과 함께 불린다", () => {
    renderPage("/result", stateOf(normal));
    expect(mockLogClick).not.toHaveBeenCalledWith("share_tap");
    fireEvent.click(shareButtons()[0]);
    expect(mockLogClick).toHaveBeenCalledWith("share_tap");
    expect(mockShareApp).toHaveBeenCalledTimes(1);
  });
});
