import type { CSSProperties } from "react";
import { Paragraph, Spacing } from "@toss/tds-mobile";
import type { Combo, DateKey, Holiday } from "@/lib/types";
import { addDays, isOffDay, parseKey } from "@/lib/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const RANK_LIMIT = 5;

const BG_OFF = "var(--adaptiveGrey100)";
const BG_LEAVE = "var(--adaptiveBlue50)";
const OUTLINE_RANGE = "2px solid var(--adaptiveBlue500)";

interface MonthCalendarProps {
  combos: Combo[];
  selected: number;
  holidays: Holiday[];
}

interface MonthInfo {
  year: number;
  month: number;
  /** 1일 앞 빈 칸 수 = 1일의 요일 index */
  leading: number;
  days: { day: number; key: DateKey }[];
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 1~5순위 구간이 걸친 월 키('YYYY-MM')를 시간 순으로 */
function collectMonthKeys(combos: Combo[]): string[] {
  const keys = new Set<string>();
  for (const c of combos.slice(0, RANK_LIMIT)) {
    for (let k = c.start; k <= c.end; k = addDays(k, 1)) {
      keys.add(k.slice(0, 7));
    }
  }
  return Array.from(keys).sort();
}

function buildMonth(monthKey: string): MonthInfo {
  const [year, month] = monthKey.split("-").map(Number);
  const first = parseKey(`${monthKey}-01`);
  const lastDay = new Date(year, month, 0).getDate();
  const days = Array.from({ length: lastDay }, (_, i) => ({
    day: i + 1,
    key: `${monthKey}-${pad2(i + 1)}`,
  }));
  return { year, month, leading: first.getDay(), days };
}

const swatchBase: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 4,
  flexShrink: 0,
};

export function MonthCalendar({ combos, selected, holidays }: MonthCalendarProps) {
  const months = collectMonthKeys(combos).map(buildMonth);
  const holidaySet = new Set<DateKey>(holidays.map((h) => h.date));
  const current: Combo | undefined = combos[selected];
  const leaveSet = new Set<DateKey>(current?.leaveDates ?? []);

  const cellStyle = (key: DateKey): CSSProperties => {
    const style: CSSProperties = {
      aspectRatio: "1",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
    if (leaveSet.has(key)) style.background = BG_LEAVE;
    else if (isOffDay(key, holidaySet)) style.background = BG_OFF;
    if (current && key >= current.start && key <= current.end) {
      style.outline = OUTLINE_RANGE;
    }
    return style;
  };

  return (
    <div>
      {months.map((m) => (
        <div key={`${m.year}-${m.month}`} data-testid="month">
          <Paragraph.Text typography="t5">
            {m.year}년 {m.month}월
          </Paragraph.Text>
          <Spacing size={8} />
          <div
            data-testid="month-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}
          >
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                data-testid="weekday-header"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
                  {w}
                </Paragraph.Text>
              </div>
            ))}
            {Array.from({ length: m.leading }, (_, i) => (
              <div key={`blank-${i}`} data-testid="empty-cell" />
            ))}
            {m.days.map((d) => (
              <div key={d.key} data-testid={`day-${d.key}`} style={cellStyle(d.key)}>
                <Paragraph.Text typography="st12">{d.day}</Paragraph.Text>
              </div>
            ))}
          </div>
          <Spacing size={16} />
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ ...swatchBase, background: BG_OFF }} />
          <Paragraph.Text typography="t7">공휴일·주말</Paragraph.Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ ...swatchBase, background: BG_LEAVE }} />
          <Paragraph.Text typography="t7">연차 쓸 날</Paragraph.Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ ...swatchBase, outline: OUTLINE_RANGE }} />
          <Paragraph.Text typography="t7">선택한 연휴</Paragraph.Text>
        </div>
      </div>
    </div>
  );
}
