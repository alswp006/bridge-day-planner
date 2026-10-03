import { useContext, useState } from "react";
import { Navigate, UNSAFE_LocationContext } from "react-router-dom";
import { Badge, Button, ListRow, Paragraph, Spacing, Top } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { Amount } from "@/components/Amount";
import { SubmitFooter } from "@/components/BottomCTA";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { EmptyState } from "@/components/StateView";
import { SummaryHero } from "@/components/SummaryHero";
import { ddayLabel, formatRange, toMD } from "@/lib/date";
import type { RouteState } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

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

export default function Result() {
  // 위치는 LocationContext에서 직접 읽고, 이동은 <Navigate>로 한다(basename은 Navigate가 처리).
  const [leaving, setLeaving] = useState(false);
  const state = toRouteState(useContext(UNSAFE_LocationContext).location.state);

  const goHome = () => setLeaving(true);
  const goHomeWithHaptic = () => {
    tickWeak();
    goHome();
  };

  if (leaving) return <Navigate to="/" />;

  const top = <Top title={<Top.TitleParagraph>징검다리 연휴</Top.TitleParagraph>} />;

  if (!state) {
    return (
      <ScreenScaffold top={top}>
        <EmptyState
          title="아직 계산한 연휴가 없어요"
          description="남은 연차를 입력하면 연휴를 찾아 드려요"
          action={
            <Button variant="weak" aria-label="연차 입력하러 가기" onClick={goHomeWithHaptic}>
              연차 입력하러 가기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  const { result, input } = state;
  const first = result.ranked[0];

  if (!first) {
    return (
      <ScreenScaffold top={top}>
        <EmptyState
          title="계산할 수 있는 연휴가 없어요"
          description="연차 일수를 바꿔서 다시 찾아볼 수 있어요"
          action={
            <Button variant="weak" aria-label="다시 입력하기" onClick={goHomeWithHaptic}>
              다시 입력하기
            </Button>
          }
        />
      </ScreenScaffold>
    );
  }

  const { nearest, efficiencyTop } = result;

  return (
    <ScreenScaffold top={top} bottom={<SubmitFooter label="다시 계산하기" onClick={goHome} />}>
      <Spacing size={8} />
      <SummaryHero
        testId="top-combo-card"
        label="1순위 최장 연휴"
        value={<Amount value={first.totalDays} unit="일" typography="t1" />}
        caption={formatRange(first.start, first.end)}
      />
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
      <Paragraph.Text typography="t7" color="var(--adaptiveGrey600)">
        {`순위마다 연차 ${formatNumber(input.leaveDays)}일 안에서 따로 계산했어요`}
      </Paragraph.Text>

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

      {/* @LOCKED_LAYER — 0007에서 '다른 조합 비교' 섹션 추가 */}
      <Spacing size={32} />
    </ScreenScaffold>
  );
}
