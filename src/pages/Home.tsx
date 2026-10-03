import { useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { Button, Loader, Paragraph, Spacing, TextField, Top } from "@toss/tds-mobile";
import { SubmitFooter } from "@/components/BottomCTA";
import { Card } from "@/components/Card";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { HOLIDAYS } from "@/data/holidays";
import { logClick } from "@/lib/analytics";
import { calculate } from "@/lib/calculator";
import { toKey } from "@/lib/date";
import { LEAVE_MAX, LEAVE_MIN, STORAGE_KEY_LAST_LEAVE } from "@/lib/types";
import type { AppInput, RouteState } from "@/lib/types";

const HINT_EMPTY = "남은 연차 일수를 입력해 주세요";
const HINT_LOADING = "연휴를 찾고 있어요";
const HELP_INVALID = `${LEAVE_MIN}~${LEAVE_MAX} 사이 정수로 입력해 주세요`;

/** 입력 문자열 → 유효한 연차 일수(1~25 정수), 아니면 null. 소수·문자·공백은 통과하지 못한다. */
function parseLeave(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= LEAVE_MIN && n <= LEAVE_MAX ? n : null;
}

/** @AI:NOTE 저장소 읽기 실패(SecurityError 등)는 "값 없음"과 같다 — AC-STORAGE-FAIL */
function readLastLeave(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_LEAVE);
    return raw != null && parseLeave(raw) != null ? raw.trim() : "";
  } catch {
    return "";
  }
}

/** @AI:NOTE 쓰기 실패(QuotaExceededError 등)는 삼키고 계산·이동은 그대로 진행한다 — AC-STORAGE-FAIL */
function saveLastLeave(n: number) {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_LEAVE, String(n));
  } catch {
    /* 저장 못 해도 결과는 보여 준다 */
  }
}

type Status = "idle" | "loading" | "error";

export default function Home() {
  const [initial] = useState(readLastLeave);
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState<RouteState | null>(null);
  const busy = useRef(false);
  const lastLeave = useRef<number | null>(null);

  const leave = parseLeave(value);
  const empty = value.trim() === "";
  const invalid = !empty && leave == null;
  const loading = status === "loading";

  const run = (n: number) => {
    if (busy.current) return;
    busy.current = true;
    lastLeave.current = n;
    setStatus("loading");
    saveLastLeave(n);
    // Spinner가 최소 1프레임 그려진 뒤 계산한다 — AC-LOADING
    setTimeout(() => {
      try {
        const input: AppInput = { leaveDays: n, today: toKey(new Date()) };
        const result = calculate(input, HOLIDAYS);
        setDone({ result, input });
      } catch {
        busy.current = false;
        setStatus("error");
      }
    }, 0);
  };

  const submit = () => {
    if (leave == null) return;
    logClick("calculate_submit");
    run(leave);
  };

  const retry = () => {
    if (lastLeave.current == null) return;
    logClick("calculate_retry");
    try {
      Promise.resolve(generateHapticFeedback({ type: "success" })).catch(() => {});
    } catch {
      /* WebView 밖에서는 throw — 무시 */
    }
    run(lastLeave.current);
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // 계산이 끝나면 <Navigate>로 한 번만 이동한다(push — 뒤로가기로 Home에 돌아올 수 있다).
  if (done) return <Navigate to="/result" state={done} />;

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>징검다리 연휴</Top.TitleParagraph>} />}
      bottom={
        <SubmitFooter
          aria-label="최장 연휴 찾기"
          label="최장 연휴 찾기"
          onClick={submit}
          disabled={leave == null || loading}
          hint={loading ? HINT_LOADING : empty ? HINT_EMPTY : undefined}
        />
      }
    >
      {initial === "" ? (
        <div data-testid="home-empty">
          <Spacing size={8} />
          <Paragraph.Text typography="t3">연차 며칠 남았나요?</Paragraph.Text>
          <Spacing size={8} />
          <Paragraph.Text typography="t6" color="var(--adaptiveGrey700)">
            남은 연차를 넣으면 오늘부터 2027년 말까지 가장 길게 쉬는 날을 찾아 드려요
          </Paragraph.Text>
        </div>
      ) : null}
      <Spacing size={24} />

      <form onSubmit={onFormSubmit} noValidate>
        <TextField
          variant="box"
          aria-label="남은 연차 일수(일)"
          label="남은 연차 일수"
          labelOption="sustain"
          placeholder="예: 15"
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          value={value}
          disabled={loading}
          hasError={touched && invalid}
          help={touched && invalid ? HELP_INVALID : undefined}
          onChange={(e) => {
            setTouched(true);
            setValue(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          onFocus={(e) => {
            try {
              e.currentTarget.scrollIntoView({ block: "center" });
            } catch {
              /* 구형 WebView — 스크롤 없이 진행 */
            }
          }}
        />
      </form>


      {loading ? (
        <>
          <Spacing size={24} />
          <div data-testid="spinner" style={{ display: "flex", justifyContent: "center" }}>
            <Loader />
          </div>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <Spacing size={24} />
          <Card testId="home-error">
            <Paragraph.Text typography="t5">계산 중 문제가 생겼어요</Paragraph.Text>
            <Spacing size={4} />
            <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
              입력한 연차로 한 번 더 계산해 볼게요
            </Paragraph.Text>
            <Spacing size={12} />
            <Button variant="weak" display="block" aria-label="다시 시도" onClick={retry}>
              다시 시도
            </Button>
          </Card>
        </>
      ) : null}
    </ScreenScaffold>
  );
}
