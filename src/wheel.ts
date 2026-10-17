export type WheelSlice = {
  id: string;
  label: string;
  share: number;
  color: string;
  text: string;
};

export type WheelRecord = {
  week: string;
  date: string;
  prizeId: string;
  share: number;
  recoveredFt: number;
  lostFt: number;
};

export const WHEEL_SLICES: WheelSlice[] = [
  { id: "all", label: "ALL", share: 1, color: "#B6FF70", text: "#10210A" },
  { id: "half", label: "50%", share: 0.5, color: "#FF9F43", text: "#10210A" },
  { id: "miss1", label: "MISS", share: 0, color: "#1C2621", text: "#A4ADA7" },
  { id: "quarter", label: "25%", share: 0.25, color: "#5EE0FF", text: "#10210A" },
  { id: "half2", label: "50%", share: 0.5, color: "#FF6BB5", text: "#10210A" },
  { id: "miss2", label: "MISS", share: 0, color: "#111815", text: "#A4ADA7" },
];

export const WHEEL_SLICE_ANGLE = 360 / WHEEL_SLICES.length;

export function pickWheelSlice() {
  return Math.floor(Math.random() * WHEEL_SLICES.length);
}

export function sliceIndexForPrize(prizeId: string) {
  const index = WHEEL_SLICES.findIndex((slice) => slice.id === prizeId);
  return index < 0 ? 0 : index;
}

export function restRotationForSlice(index: number) {
  return 360 - (index + 0.5) * WHEEL_SLICE_ANGLE;
}

export function spinRotationForSlice(index: number, turns = 5) {
  return turns * 360 + restRotationForSlice(index);
}

export function prizeCopy(share: number, recoveredFt: number, lostFt: number) {
  if (lostFt <= 0) return "Nothing was lost yesterday, so this spin cannot return Ft.";
  if (share >= 1) return "Yesterday's missed-task penalty comes back in full.";
  if (share > 0) return `You recovered ${Math.round(share * 100)}% of yesterday's lost Ft.`;
  return "The wheel missed. You can try again in 7 days.";
}
