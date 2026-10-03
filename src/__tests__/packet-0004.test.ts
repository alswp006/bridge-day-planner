import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RouterProvider, createMemoryRouter, useLocation } from "react-router-dom";
import { mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import Home from "@/pages/Home";
import { calculate } from "@/lib/calculator";

mockAppsInToss();

vi.mock("@toss/tds-mobile", () => {
  const h = React.createElement;
  const Field = React.forwardRef(({ label, labelOption, help, hasError, variant, suffix, prefix, right, ...props }: any, ref: any) =>
    h(
      "div",
      null,
      label != null ? h("label", null, label) : null,
      h("input", { ref, "aria-invalid": hasError ? true : undefined, ...props }),
      help != null ? h("span", { "data-slot": "help", role: hasError ? "alert" : undefined }, help) : null,
    ),
  );
  const asset = new Proxy({}, { get: () => (p: any) => h("span", { "data-asset": true, role: "img", "aria-label": p?.alt ?? "icon" }) });
  const text = ({ children }: any) => h("span", null, children);
  return {
    Top: Object.assign(({ title, subtitleBottom, subtitle }: any) => h("header", null, title, subtitleBottom, subtitle), {
      TitleParagraph: text,
      SubtitleParagraph: text,
    }),
    TextField: Field,
    Button: ({ children, onClick, loading, display, size, variant, color, ...props }: any) =>
      h("button", { type: "button", onClick, disabled: props.disabled || loading || undefined, ...props }, children),
    FixedBottomCTA: ({ children, onClick, disabled, loading, topAccessory, bottomAccessory, fixedAboveKeyboard, background, ...props }: any) =>
      h(
        React.Fragment,
        null,
        topAccessory != null ? h("div", { "data-slot": "top-accessory" }, topAccessory) : null,
        h("button", { onClick, disabled: disabled || loading || undefined, ...props }, children),
      ),
    Paragraph: Object.assign(({ children }: any) => h("div", null, children), { Text: text }),
    Spacing: () => h("div"),
    Spinner: () => h("div", { role: "progressbar", "data-testid": "spinner" }),
    // 벤더(@toss/tds-mobile 2.5.1)에는 Spinner가 없다 — 인라인 로딩 인디케이터는 Loader다.
    Loader: () => h("div", { role: "progressbar" }),
    Skeleton: () => h("div"),
    Asset: asset,
    Badge: text,
    Text: text,
  };
});
vi.mock("@/state/AppStateContext", () => ({
  useAppState: () => ({ setInput: vi.fn() }),
}));
vi.mock("@/lib/calculator", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/calculator")>()),
  calculate: vi.fn(),
}));

const KEY = "bridge-day:lastLeave";
const fakeResult = { ranked: [], efficiencyTop: [], nearest: null };
const calcMock = calculate as unknown as ReturnType<typeof vi.fn>;
let errSpy: ReturnType<typeof vi.spyOn>;
const scrollSpy = vi.fn();

function Probe() {
  const loc = useLocation();
  return React.createElement("div", { "data-testid": "result-probe" }, loc.pathname, JSON.stringify((loc.state as any)?.input?.leaveDays));
}

function setup() {
  const router = createMemoryRouter(
    [
      { path: "/", element: React.createElement(Home) },
      { path: "/result", element: React.createElement(Probe) },
    ],
    { initialEntries: ["/"] },
  );
  const navSpy = vi.spyOn(router, "navigate");
  render(React.createElement(RouterProvider, { router }));
  return { router, navSpy };
}

const input = () => document.querySelector("input") as HTMLInputElement;
const footer = () => screen.getByRole("button", { name: /최장 연휴 찾기/ }) as HTMLButtonElement;
const type = (v: string) => fireEvent.change(input(), { target: { value: v } });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T09:00:00+09:00"));
  calcMock.mockReset();
  calcMock.mockReturnValue(fakeResult);
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  scrollSpy.mockClear();
  (Element.prototype as any).scrollIntoView = scrollSpy;
});
afterEach(() => {
  errSpy.mockRestore();
  vi.restoreAllMocks();
});

describe("Home Page: 연차 입력 + 계산", () => {
  it("AC-1[P0]: 빈 입력이면 버튼 disabled + hint, 첫 렌더에서 에러 아님", () => {
    setup();
    expect(footer().disabled).toBe(true);
    expect(screen.getByText("남은 연차 일수를 입력해 주세요")).toBeTruthy();
    expect(input().getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText("1~25 사이 정수로 입력해 주세요")).toBeNull();
  });

  it("AC-2[P0]: 0/26/2.5/abc는 help + disabled, 15는 enabled", () => {
    setup();
    for (const bad of ["0", "26", "2.5", "abc"]) {
      type(bad);
      expect(screen.getByText("1~25 사이 정수로 입력해 주세요")).toBeTruthy();
      expect(footer().disabled).toBe(true);
    }
    type("15");
    expect(footer().disabled).toBe(false);
    expect(screen.queryByText("1~25 사이 정수로 입력해 주세요")).toBeNull();
  });

  it("AC-3[P0]: 저장값 15면 미리 채우고, 없음/30/x/getItem throw면 빈칸 + EmptyState", () => {
    localStorage.setItem(KEY, "15");
    const first = render(React.createElement(RouterProvider, {
      router: createMemoryRouter([{ path: "/", element: React.createElement(Home) }]),
    }));
    expect(input().value).toBe("15");
    expect(screen.queryByText("연차 며칠 남았나요?")).toBeNull();
    first.unmount();

    for (const stored of [null, "30", "x"]) {
      localStorage.clear();
      if (stored !== null) localStorage.setItem(KEY, stored);
      const r = render(React.createElement(RouterProvider, {
        router: createMemoryRouter([{ path: "/", element: React.createElement(Home) }]),
      }));
      expect(input().value).toBe("");
      expect(screen.getByText("연차 며칠 남았나요?")).toBeTruthy();
      r.unmount();
    }

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    render(React.createElement(RouterProvider, {
      router: createMemoryRouter([{ path: "/", element: React.createElement(Home) }]),
    }));
    expect(input().value).toBe("");
    expect(screen.getByText("연차 며칠 남았나요?")).toBeTruthy();
  });

  it("AC-4[P0]: 탭하면 저장하고 /result로 이동, state에 입력값 포함", async () => {
    setup();
    type("15");
    fireEvent.click(footer());
    await waitFor(() => expect(screen.getByTestId("result-probe").textContent).toBe("/result15"));
    expect(localStorage.getItem(KEY)).toBe("15");
    expect(calcMock).toHaveBeenCalledTimes(1);
    expect(calcMock.mock.calls[0][0]).toMatchObject({ leaveDays: 15 });
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("AC-4[P0]: setItem이 throw해도 /result로 이동하고 console.error 0건", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    setup();
    type("10");
    fireEvent.click(footer());
    await waitFor(() => expect(screen.getByTestId("result-probe").textContent).toBe("/result10"));
    expect(calcMock).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledTimes(0);
  });

  it("AC-5[P0]: 계산 중 Spinner + 입력/버튼 disabled, 더블 탭해도 calculate 1회 · navigate 1회", async () => {
    const { navSpy } = setup();
    type("15");
    fireEvent.click(footer());
    fireEvent.click(footer());
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(input().disabled).toBe(true);
    expect(footer().disabled).toBe(true);
    await waitFor(() => expect(screen.getByTestId("result-probe").textContent).toBe("/result15"));
    expect(calcMock).toHaveBeenCalledTimes(1);
    expect(navSpy).toHaveBeenCalledTimes(1);
  });

  it("AC-6[P0]: calculate가 throw하면 재시도 UI, '다시 시도'는 같은 입력으로 재호출", async () => {
    calcMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    setup();
    type("12");
    fireEvent.click(footer());
    await waitFor(() => expect(screen.getByText("계산 중 문제가 생겼어요")).toBeTruthy());
    expect(calcMock).toHaveBeenCalledTimes(1);
    expect(errSpy).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(screen.getByTestId("result-probe").textContent).toBe("/result12"));
    expect(calcMock).toHaveBeenCalledTimes(2);
    expect(calcMock.mock.calls[1][0]).toMatchObject({ leaveDays: 12 });
    expect(errSpy).toHaveBeenCalledTimes(0);
  });

  it("AC-7[P1]: TextField와 재시도 버튼에 aria-label, 포커스하면 scrollIntoView(center)", async () => {
    calcMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    setup();
    expect((input().getAttribute("aria-label") ?? "").length).toBeGreaterThan(0);
    act(() => input().focus());
    expect(scrollSpy).toHaveBeenCalledWith({ block: "center" });

    type("7");
    fireEvent.click(footer());
    const retry = await screen.findByRole("button", { name: "다시 시도" });
    expect((retry.getAttribute("aria-label") ?? "").length).toBeGreaterThan(0);
  });
});
