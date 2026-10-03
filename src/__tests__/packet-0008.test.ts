import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockAppsInToss } from "@/__tests__/__helpers__/mocks";
import App from "@/App";

mockTds();
mockAppsInToss();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-04T09:00:00+09:00"));
  (Element.prototype as any).scrollIntoView = vi.fn();
});

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const srcFiles = walk(join(ROOT, "src")).filter((f) => !f.includes("__tests__"));

function renderAt(path: string, state?: unknown) {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: path, state }] },
      React.createElement(App),
    ),
  );
}

/** JSX 여는 태그 전체 텍스트를 뽑는다 (중괄호 안의 > 는 무시). */
function openingTags(source: string, names: string[]): { name: string; text: string }[] {
  const found: { name: string; text: string }[] = [];
  const re = new RegExp(`<(${names.join("|")})(?=[\\s/>])`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < source.length; i++) {
      const c = source[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    found.push({ name: m[1], text: source.slice(m.index, i + 1) });
  }
  return found;
}

describe("Routing & Integration + 검수 점검", () => {
  it("AC-1[P0]: '/'는 Home, '/result'는 Result를 렌더링한다", () => {
    const home = renderAt("/");
    expect(screen.getByRole("button", { name: /최장 연휴 찾기/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다시 계산하기" })).toBeNull();
    home.unmount();

    renderAt("/result");
    // state 없이 직접 진입 → Result 빈 상태
    expect(screen.getByText("아직 계산한 연휴가 없어요")).toBeTruthy();
    expect(screen.getByRole("button", { name: "연차 입력하러 가기" })).toBeTruthy();
  });

  it("AC-1[P0]: Home에서 연차를 입력해 계산하면 Result 화면에 결과가 표시된다", async () => {
    renderAt("/");
    const input = document.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /최장 연휴 찾기/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: "다시 계산하기" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: /최장 연휴 찾기/ })).toBeNull();
    expect(screen.queryByText("아직 계산한 연휴가 없어요")).toBeNull();
  });

  it("AC-1: 정의되지 않은 경로는 Home으로 돌아온다", () => {
    renderAt("/nowhere");
    expect(screen.getByRole("button", { name: /최장 연휴 찾기/ })).toBeTruthy();
    expect(screen.queryByText("아직 계산한 연휴가 없어요")).toBeNull();
  });

  it("AC-3[P0]: 모든 화면의 Top 제목은 '징검다리 연휴'다", () => {
    const home = renderAt("/");
    expect(screen.getAllByText("징검다리 연휴").length).toBeGreaterThanOrEqual(1);
    expect(document.body.textContent).not.toMatch(/Bridge Day Planner|bridge-day-planner/);
    home.unmount();

    renderAt("/result");
    expect(screen.getAllByText("징검다리 연휴").length).toBeGreaterThanOrEqual(1);
    expect(document.body.textContent).not.toMatch(/Bridge Day Planner|bridge-day-planner/);

    for (const f of ["src/pages/Home.tsx", "src/pages/Result.tsx"]) {
      const s = readFileSync(join(ROOT, f), "utf8");
      expect(s).toContain("<Top.TitleParagraph>징검다리 연휴</Top.TitleParagraph>");
    }
  });

  it("AC-2[P0]: src(테스트 제외)에 console.error / https:// / gtag / amplitude가 0건이다", () => {
    const hits: string[] = [];
    for (const f of srcFiles) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/console\.error|https:\/\/|gtag|amplitude/.test(line)) hits.push(`${relative(ROOT, f)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
    expect(srcFiles.length).toBeGreaterThan(5);
  });

  it("AC-4[P1]: pages·components의 모든 Button/SubmitFooter/TextField에 aria-label이 있다", () => {
    const targets = srcFiles.filter(
      (f) => /src\/(pages|components)\//.test(f.replace(/\\/g, "/")) && !f.includes("__TdsGallery"),
    );
    const missing: string[] = [];
    let checked = 0;
    for (const f of targets) {
      const code = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const tag of openingTags(code, ["Button", "SubmitFooter", "TextField"])) {
        checked++;
        if (!/aria-label\s*=/.test(tag.text)) missing.push(`${relative(ROOT, f)}: ${tag.text.replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }
    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  });

  it("AC-5[P0]: 외부 링크(<a href=http…>, openURL)와 GA/Amplitude import가 0개다", () => {
    const hits: string[] = [];
    for (const f of srcFiles) {
      const s = readFileSync(f, "utf8");
      if (/<a\s[^>]*href\s*=\s*["']?\{?\s*["'`]?https?:/i.test(s)) hits.push(`${relative(ROOT, f)}: a href`);
      if (/\bopenURL\b/.test(s)) hits.push(`${relative(ROOT, f)}: openURL`);
      if (/window\.open\(|window\.location\.href\s*=/.test(s)) hits.push(`${relative(ROOT, f)}: outlink`);
      if (/from\s+["'](react-ga4?|@amplitude\/[^"']*|amplitude-js|@vercel\/analytics)["']/.test(s)) hits.push(`${relative(ROOT, f)}: analytics import`);
    }
    expect(hits).toEqual([]);
    expect(srcFiles.some((f) => f.endsWith("App.tsx"))).toBe(true);
  });

  it("AC-6[P0]: main.tsx는 git diff 0줄이고 npm run build가 종료 코드 0으로 끝난다", () => {
    const diff = execSync("git diff HEAD --stat -- src/main.tsx", { cwd: ROOT }).toString().trim();
    expect(diff).toBe("");
    let code = 0;
    try {
      execSync("npm run build", { cwd: ROOT, stdio: "pipe", timeout: 240_000 });
    } catch (e: any) {
      code = e.status ?? 1;
    }
    expect(code).toBe(0);
  }, 300_000);
});
