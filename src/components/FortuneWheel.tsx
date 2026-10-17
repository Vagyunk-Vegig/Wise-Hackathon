import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { WHEEL_SLICE_ANGLE, WHEEL_SLICES } from "../wheel";
import { colors } from "../theme";
import { icons } from "./Icons";
import { WHEEL_COOLDOWN_DAYS } from "../dates";

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y} Z`;
}

export function FortuneWheel({
  size,
  rotation,
  locked = false,
  daysLeft = 0,
  unlockLabel,
}: {
  size: number;
  rotation: Animated.Value;
  locked?: boolean;
  daysLeft?: number;
  unlockLabel?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const hub = Math.round(size * 0.16);
  const remaining = Math.max(0, Math.min(WHEEL_COOLDOWN_DAYS, daysLeft));

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.pointer, { borderTopColor: locked ? colors.muted : colors.accent }]} />
      <Animated.View
        style={{
          width: size,
          height: size,
          opacity: locked ? 0.22 : 1,
          transform: [{ rotate: rotation.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }) }],
        }}
      >
        <Svg width={size} height={size}>
          {WHEEL_SLICES.map((slice, index) => {
            const start = -90 + index * WHEEL_SLICE_ANGLE;
            const end = start + WHEEL_SLICE_ANGLE;
            const mid = start + WHEEL_SLICE_ANGLE / 2;
            const label = polar(cx, cy, r * 0.62, mid);
            return (
              <G key={slice.id}>
                <Path d={slicePath(cx, cy, r, start, end)} fill={slice.color} stroke={colors.bg} strokeWidth={2} />
                <SvgText
                  x={label.x}
                  y={label.y}
                  fill={slice.text}
                  fontSize={13}
                  fontWeight="700"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${mid + 90}, ${label.x}, ${label.y})`}
                >
                  {slice.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </Animated.View>
      {locked ? (
        <View style={[styles.lockLayer, { width: size, height: size, borderRadius: size / 2 }]} pointerEvents="none">
          <View style={styles.lockCard}>
            <View style={styles.lockRing}>
              <icons.LockKeyhole size={28} color={colors.accent} />
            </View>
            <Text style={styles.lockTitle}>Locked</Text>
            <Text style={styles.lockDays}>
              {remaining === 1 ? "1 day left" : `${remaining} days left`}
            </Text>
            <View style={styles.pips}>
              {Array.from({ length: WHEEL_COOLDOWN_DAYS }, (_, index) => (
                <View key={index} style={[styles.pip, index < remaining ? styles.pipOn : styles.pipOff]} />
              ))}
            </View>
            {unlockLabel ? <Text style={styles.lockDate}>Opens {unlockLabel}</Text> : null}
          </View>
        </View>
      ) : (
        <View style={[styles.hub, { width: hub, height: hub, borderRadius: hub / 2, left: (size - hub) / 2, top: (size - hub) / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pointer: {
    position: "absolute",
    top: 6,
    left: "50%",
    marginLeft: -10,
    zIndex: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  hub: {
    position: "absolute",
    backgroundColor: colors.bg,
    borderWidth: 3,
    borderColor: colors.accent,
    zIndex: 2,
  },
  lockLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,13,11,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(182,255,112,0.28)",
    zIndex: 3,
  },
  lockCard: { alignItems: "center", gap: 8, paddingHorizontal: 24 },
  lockRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lockTitle: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: 0.4 },
  lockDays: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  lockDate: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  pips: { flexDirection: "row", gap: 6, marginTop: 4, marginBottom: 2 },
  pip: { width: 8, height: 8, borderRadius: 4 },
  pipOn: { backgroundColor: colors.accent },
  pipOff: { backgroundColor: colors.track, borderWidth: 1, borderColor: colors.border },
});
