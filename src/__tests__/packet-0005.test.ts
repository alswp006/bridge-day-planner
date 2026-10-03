import { describe, it, expect, vi } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Combo, Holiday } from "@/lib/types";
import { MonthCalendar } from "@/components/MonthCalendar";

vi.mock("@toss/tds-mobile", () => ({
  Paragraph: { Text: ({ children }: { children?: React.ReactNode }) => React.createElement("span", null, children) },
  Spacing: () => React.createElement("div"),
}));
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>("react-router-dom")),
  useNavigate: () => mockNavigate,
}));
vi.mock("@/state/AppStateContext", () => ({
  useAppState: () => ({ setInput: vi.fn() }),
}));

// 2026-10-01 = 목요일(빈 칸 4개), 2027-02-01 = 월요일(빈 칸 1개)
const combos: Combo[] = [
  {
    start: "2026-10-03",
    end: "2026-10-11",
    totalDays: 9,
    leaveDates: ["2026-10-06", "2026-10-07", "2026-10-08"],
    holidayNames: ["개천절", "대체공휴일", "한글날"],
    efficiency: 3,
    dday: 0,
  },
  {
    start: "2027-02-06",
    end: "2027-02-10",
    totalDays: 5,
    leaveDates: ["2027-02-09", "2027-02-10"],
    holidayNames: ["설날", "대체공휴일"],
    efficiency: 2.5,
    dday: 126,
  },
];
const holidays: Holiday[] = [
  { date: "2026-10-03", name: "개천절", isSubstitute: false },
  { date: "2026-10-05", name: "개천절 대체공휴일", isSubstitute: true },
  { date: "2026-10-09", name: "한글날", isSubstitute: false },
  { date: "2027-02-08", name: "설날 대체공휴일", isSubstitute: true },
];

// 구현 계약: 월 = data-testid="month", 그리드 = "month-grid", 요일 헤더 = "weekday-header",
// 빈 칸 = "empty-cell", 날짜 칸 = `day-YYYY-MM-DD`
function renderCal(selected: number) {
  return render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(MonthCalendar, { combos, selected, holidays }),
    ),
  );
}
const styleOf = (el: HTMLElement) => el.getAttribute("style") ?? "";
const day = (k: string) => screen.getByTestId(`day-${k}`);

describe("MonthCalendar 컴포넌트", () => {
  it("AC-1: 구간이 걸친 월만 시간 순으로 렌더링한다", () => {
    renderCal(0);
    const months = screen.getAllByTestId("month");
    expect(months).toHaveLength(2);
    expect(months[0]).toHaveTextContent("2026년 10월");
    expect(months[1]).toHaveTextContent("2027년 2월");
    expect(screen.queryByText("2026년 11월")).toBeNull();
    expect(screen.queryByText("2027년 1월")).toBeNull();
  });

  it("AC-2: 7열 grid, 요일 헤더 일~토, 1일 앞 빈 칸 수가 요일 index와 같다", () => {
    renderCal(0);
    const months = screen.getAllByTestId("month");
    const grids = screen.getAllByTestId("month-grid");
    expect(grids).toHaveLength(2);
    grids.forEach((g) => expect(g.style.gridTemplateColumns).toBe("repeat(7, 1fr)"));

    const headers = within(months[0]).getAllByTestId("weekday-header");
    expect(headers.map((h) => h.textContent)).toEqual(["일", "월", "화", "수", "목", "금", "토"]);

    expect(within(months[0]).getAllByTestId("empty-cell")).toHaveLength(4);
    expect(within(months[1]).getAllByTestId("empty-cell")).toHaveLength(1);
  });

  it("AC-3: 주말·공휴일은 Grey100, 연차 쓸 날은 Blue50, 선택 구간은 Blue500 2px outline", () => {
    renderCal(0);
    // 토/일, 공휴일(평일 10-05 월)
    expect(styleOf(day("2026-10-10"))).toContain("var(--adaptiveGrey100)");
    expect(styleOf(day("2026-10-04"))).toContain("var(--adaptiveGrey100)");
    expect(styleOf(day("2026-10-05"))).toContain("var(--adaptiveGrey100)");
    // 연차 쓸 날
    expect(styleOf(day("2026-10-06"))).toContain("var(--adaptiveBlue50)");
    expect(styleOf(day("2026-10-06"))).not.toContain("var(--adaptiveGrey100)");
    // 구간 윤곽선
    for (const k of ["2026-10-03", "2026-10-06", "2026-10-09", "2026-10-11"]) {
      expect(styleOf(day(k))).toContain("var(--adaptiveBlue500)");
      expect(styleOf(day(k))).toContain("2px");
    }
    // 구간 밖 평일: 배경·윤곽선 없음
    expect(styleOf(day("2026-10-01"))).not.toContain("var(--adaptive");
    expect(styleOf(day("2026-10-13"))).not.toContain("var(--adaptive");
    // 선택하지 않은 순위의 연차일은 칠하지 않는다
    expect(styleOf(day("2027-02-09"))).not.toContain("var(--adaptiveBlue");
  });

  it("AC-4: selected가 바뀌면 배경과 윤곽선이 새 순위 구간으로만 이동한다", () => {
    const { unmount } = renderCal(0);
    expect(styleOf(day("2026-10-07"))).toContain("var(--adaptiveBlue50)");
    unmount();

    renderCal(1);
    expect(styleOf(day("2026-10-07"))).not.toContain("var(--adaptiveBlue");
    expect(styleOf(day("2026-10-03"))).not.toContain("var(--adaptiveBlue500)");
    expect(styleOf(day("2027-02-09"))).toContain("var(--adaptiveBlue50)");
    expect(styleOf(day("2027-02-10"))).toContain("var(--adaptiveBlue50)");
    for (const k of ["2027-02-06", "2027-02-08", "2027-02-10"]) {
      expect(styleOf(day(k))).toContain("var(--adaptiveBlue500)");
    }
    // 공휴일 배경은 선택과 무관하게 유지
    expect(styleOf(day("2026-10-05"))).toContain("var(--adaptiveGrey100)");
  });

  it("AC-5: 범례 3개가 렌더링된다", () => {
    renderCal(0);
    expect(screen.getAllByText("공휴일·주말")).toHaveLength(1);
    expect(screen.getAllByText("연차 쓸 날")).toHaveLength(1);
    expect(screen.getAllByText("선택한 연휴")).toHaveLength(1);
  });

  it("AC-5: 소스에 HEX/RGB 색상 리터럴과 onClick이 없다", () => {
    const src = readFileSync("src/components/MonthCalendar.tsx", "utf8");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/rgba?\(/i);
    expect(src).not.toMatch(/onClick/);
    expect(src).toContain("var(--adaptiveBlue500)");
  });
});
