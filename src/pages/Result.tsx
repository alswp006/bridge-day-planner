import { useContext, useEffect, useState } from "react";
import { Navigate, UNSAFE_LocationContext } from "react-router-dom";
import { Asset, Badge, Button, Chip, ChipItem, ListRow, Paragraph, Spacing, Top } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { Amount } from "@/components/Amount";
import { SubmitFooter } from "@/components/BottomCTA";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { MonthCalendar } from "@/components/MonthCalendar";
import { EmptyState } from "@/components/StateView";
import { SummaryHero } from "@/components/SummaryHero";
import { TossRewardAd } from "@/components/TossRewardAd";
import { HOLIDAYS } from "@/data/holidays";
import { logClick } from "@/lib/analytics";
import { ddayLabel, formatRange, toMD } from "@/lib/date";
import { requestReviewOnce } from "@/lib/review";
import { shareApp } from "@/lib/share";
import type { Combo, Holiday, RouteState } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { getItem, setItem } from "@/lib/storage";

const PLANS_KEY = "bridge-day:plans";

interface SavedPlan {
  start: string;
  end: string;
  totalDays: number;
  leaveCount: number;
}

function loadPlans(): SavedPlan[] {
  const v = getItem<SavedPlan[]>(PLANS_KEY);
  return Array.isArray(v) ? v : [];
}

/** 올해가 아닌 연휴는 연도를 붙여 지난 날짜로 오해하지 않게 한다. */
function rangeWithYear(start: string, end: string): string {
  const year = start.slice(0, 4);
  const text = formatRange(start, end);
  return year === String(new Date().getFullYear()) ? text : `${year}년 ${text}`;
}

function toPlan(c: Combo): SavedPlan {
  return { start: c.start, end: c.end, totalDays: c.totalDays, leaveCount: c.leaveDates.length };
}

/** location.state를 RouteState로 좁힌다. 직접 진입·형태 깨짐이면 null. */
function toRouteState(raw: unknown): RouteState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { result, input } = raw as Partial<RouteState>;
  if (typeof result !== "object" || result === null) return null;
  if (!Array.isArray(result.ranked) || !Array.isArray(result.efficiencyTop)) return null;
  if (typeof input !== "object" || input === null || typeof input.leaveDays !== "number") return null;
  return { result, input };
}

function tickWeak() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "tickWeak" })).catch(() => {});
  } catch {
    /* WebView 밖에서는 throw — 무시 */
  }
}

/** 광고 게이트 안쪽 — 2~5순위 비교와 월별 달력. 선택 상태가 여기 있어 칩을 눌러도 게이트는 다시 마운트되지 않는다. */
function LockedLayer({
  ranked,
  holidays,
  onSave,
  isSaved,
}: {
  ranked: Combo[];
  holidays: Holiday[];
  onSave: (c: Combo) => void;
  isSaved: (c: Combo) => boolean;
}) {
  const [selected, setSelected] = useState(0);

  return (
    <>
      {ranked.slice(1).map((c, i) => (
        <ListRow
          key={c.start}
          left={<Paragraph.Text typography="t5">{`${i + 2}위`}</Paragraph.Text>}
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={formatRange(c.start, c.end)}
              bottom={`연속 ${formatNumber(c.totalDays)}일 · 연차 ${formatNumber(c.leaveDates.length)}일 · 1일당 ${formatNumber(c.efficiency)}일`}
            />
          }
        />
      ))}
      <Spacing size={24} />
      <Paragraph.Text typography="t4">월별 달력</Paragraph.Text>
      <Spacing size={12} />
      <Chip kind="select" size="small" wrap>
        {ranked.map((c, i) => (
          <ChipItem
            key={c.start}
            selected={selected === i}
            onClick={() => {
              tickWeak();
              setSelected(i);
            }}
          >
            {`${i + 1}위`}
          </ChipItem>
        ))}
      </Chip>
      <Spacing size={16} />
      <MonthCalendar combos={ranked} selected={selected} holidays={holidays} />
      <Spacing size={16} />
      <Button
        display="block"
        variant="weak"
        aria-label={`${selected + 1}위를 내 계획으로 저장`}
        disabled={isSaved(ranked[selected])}
        onClick={() => onSave(ranked[selected])}
      >
        {isSaved(ranked[selected]) ? `${selected + 1}위 계획에 저장됨` : `${selected + 1}위를 내 계획으로 저장`}
      </Button>
    </>
  );
}

export default function Result() {
  // 위치는 LocationContext에서 직접 읽고, 이동은 <Navigate>로 한다(basename은 Navigate가 처리).
  const [leaving, setLeaving] = useState(false);
  const [plans, setPlans] = useState<SavedPlan[]>(loadPlans);
  const state = toRouteState(useContext(UNSAFE_LocationContext).location.state);

  const goHome = () => setLeaving(true);
  const goHomeWithHaptic = () => {
    tickWeak();
    goHome();
  };

  const isSaved = (c: Combo) => plans.some((p) => p.start === c.start && p.end === c.end);
  const savePlan = (c: Combo) => {
    if (isSaved(c)) return;
    tickWeak();
    const next = [...plans, toPlan(c)];
    try {
      setItem(PLANS_KEY, next);
    } catch {
      /* 저장 공간 오류 — 화면 상태만 갱신 */
    }
    setPlans(next);
  };

  // 1순위 결과가 실제로 화면에 나온 뒤에만 리뷰를 요청한다(빈 상태·빈 결과에서는 부르지 않는다).
  const hasResult = (state?.result.ranked.length ?? 0) > 0;
  useEffect(() => {
    if (hasResult) requestReviewOnce();
  }, [hasResult]);

  if (leaving) return <Navigate to="/" />;

  const top = <Top title={<Top.TitleParagraph>징검다리 연휴</Top.TitleParagraph>} />;

  if (!state) {
    return (
      <ScreenScaffold top={top} bottom={<SubmitFooter aria-label="연차 입력하러 가기" label="연차 입력하러 가기" onClick={goHomeWithHaptic} />}>
        <EmptyState
          centered
          icon={<Asset.ContentIcon name="iconStarRegular" alt="" style={{ width: 48, height: 48 }} />}
          title="아직 계산한 연휴가 없어요"
          description="남은 연차를 입력하면 연휴를 찾아 드려요"
        />
      </ScreenScaffold>
    );
  }

  const { result, input } = state;
  const first = result.ranked[0];

  if (!first) {
    return (
      <ScreenScaffold top={top} bottom={<SubmitFooter aria-label="다시 입력하기" label="다시 입력하기" onClick={goHomeWithHaptic} />}>
        <EmptyState
          centered
          icon={<Asset.ContentIcon name="iconStarRegular" alt="" style={{ width: 48, height: 48 }} />}
          title="계산할 수 있는 연휴가 없어요"
          description="연차 일수를 바꿔서 다시 찾아볼 수 있어요"
        />
      </ScreenScaffold>
    );
  }

  const { nearest, efficiencyTop } = result;

  return (
    <ScreenScaffold top={top} bottom={<SubmitFooter aria-label="다시 계산하기" label="다시 계산하기" onClick={goHome} />}>
      <Spacing size={8} />
      <SummaryHero
        testId="top-combo-card"
        label="1순위 최장 연휴"
        value={<Amount value={first.totalDays} unit="일" typography="t1" />}
        caption={rangeWithYear(first.start, first.end)}
      />
      <Button display="block" variant="weak" aria-label="1위를 내 계획으로 저장" disabled={isSaved(first)} onClick={() => savePlan(first)}>
        {isSaved(first) ? "1위 계획에 저장됨" : "1위를 내 계획으로 저장"}
      </Button>
      <ListRow
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top={`연차 ${formatNumber(first.leaveDates.length)}일 사용`}
            bottom={first.leaveDates.map(toMD).join(", ")}
          />
        }
        right={
          <Badge size="small" variant="fill" color="blue">
            {ddayLabel(first.dday)}
          </Badge>
        }
      />
      <Spacing size={8} />
      <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
        {`순위마다 연차 ${formatNumber(input.leaveDays)}일 안에서 따로 계산했어요`}
      </Paragraph.Text>
      <Spacing size={12} />
      <Button
        display="block"
        variant="weak"
        aria-label="찾은 연휴 공유하기"
        onClick={() => {
          logClick("share_tap");
          void shareApp({
            message: `${rangeWithYear(first.start, first.end)}, 연차 ${formatNumber(first.leaveDates.length)}일로 ${formatNumber(first.totalDays)}일 쉴 수 있어요`,
            path: "/",
          });
        }}
      >
        찾은 연휴 공유하기
      </Button>

      <Spacing size={24} />
      <Paragraph.Text typography="t4">저장된 계획</Paragraph.Text>
      <Spacing size={12} />
      {plans.length === 0 ? (
        <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
          저장한 연휴가 아직 없어요
        </Paragraph.Text>
      ) : (
        plans.map((p) => (
          <ListRow
            key={`${p.start}-${p.end}`}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={rangeWithYear(p.start, p.end)}
                bottom={`연속 ${formatNumber(p.totalDays)}일 · 연차 ${formatNumber(p.leaveCount)}일`}
              />
            }
          />
        ))
      )}
      {nearest ? (
        <>
          <Spacing size={24} />
          <Paragraph.Text typography="t4">다음 연결 연휴</Paragraph.Text>
          <Spacing size={12} />
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={formatRange(nearest.start, nearest.end)}
                bottom={`연속 ${formatNumber(nearest.totalDays)}일 · 연차 ${formatNumber(nearest.leaveDates.length)}일`}
              />
            }
            right={
              <Badge size="small" variant="weak" color="teal">
                {ddayLabel(nearest.dday)}
              </Badge>
            }
          />
        </>
      ) : null}

      {efficiencyTop.length > 0 ? (
        <>
          <Spacing size={24} />
          <Paragraph.Text typography="t4">효율 TOP 3</Paragraph.Text>
          <Spacing size={12} />
          {efficiencyTop.map((c) => (
            <ListRow
              key={c.start}
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={`연차 1일당 ${formatNumber(c.efficiency)}일`}
                  bottom={formatRange(c.start, c.end)}
                />
              }
              right={
                <Badge size="small" variant="weak" color="green">
                  {`${formatNumber(c.totalDays)}일`}
                </Badge>
              }
            />
          ))}
        </>
      ) : null}

      {/* @LOCKED_LAYER */}
      <Spacing size={24} />
      <Paragraph.Text typography="t4">다른 조합 비교</Paragraph.Text>
      <Spacing size={12} />
      {result.ranked.length < 2 ? (
        <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
          다른 조합이 없어요
        </Paragraph.Text>
      ) : (
        <>
          <Paragraph.Text typography="t7" color="var(--adaptiveGrey600)">
            광고를 보면 2~5순위 비교와 월별 달력을 볼 수 있어요
          </Paragraph.Text>
          <Spacing size={12} />
          <TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>
            <LockedLayer ranked={result.ranked} holidays={HOLIDAYS} onSave={savePlan} isSaved={isSaved} />
          </TossRewardAd>
        </>
      )}
      <Spacing size={32} />
    </ScreenScaffold>
  );
}
