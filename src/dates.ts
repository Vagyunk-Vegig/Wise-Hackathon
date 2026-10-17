export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const TODAY = (() => {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
})();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return { year, month, day, weekday: WEEKDAYS[utc.getUTCDay()] };
}

export function shortDate(iso: string) {
  const { weekday, month, day } = parts(iso);
  return `${weekday}, ${MONTHS[month - 1]} ${day}`;
}

export function longDate(iso: string) {
  const { weekday, month, day, year } = parts(iso);
  return `${weekday}, ${MONTHS[month - 1]} ${day}, ${year}`;
}

export function shiftDate(iso: string, days: number) {
  const { year, month, day } = parts(iso);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function daysFromToday(iso: string) {
  const a = parts(TODAY);
  const b = parts(iso);
  const start = Date.UTC(a.year, a.month - 1, a.day);
  const end = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((end - start) / 86_400_000);
}

export function dueChip(iso: string) {
  const days = daysFromToday(iso);
  if (days === 0) return "Due today";
  if (days < 0) return "Overdue";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function contributionWeeks(endIso: string, weekCount = 53) {
  const { year, month, day } = parts(endIso);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const last = shiftDate(endIso, 6 - weekday);
  const first = shiftDate(last, -(weekCount * 7 - 1));
  const weeks: string[][] = [];
  for (let week = 0; week < weekCount; week += 1) {
    const column: string[] = [];
    for (let offset = 0; offset < 7; offset += 1) column.push(shiftDate(first, week * 7 + offset));
    weeks.push(column);
  }
  return weeks;
}

export function contributionMonthLabels(weeks: string[][]) {
  const labels = weeks.map(() => "");
  weeks.forEach((week, index) => {
    const first = week.find((iso) => parts(iso).day === 1);
    if (!first) return;
    const target = parts(first).weekday === "Sat" && index + 1 < weeks.length ? index + 1 : index;
    labels[target] = MONTHS[parts(first).month - 1];
  });
  return labels;
}

export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function moneyLabel(amount: number) {
  const formatted = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(amount);
  return `−${formatted} Ft`;
}
