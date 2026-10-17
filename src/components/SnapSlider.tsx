import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function SnapSlider({ min, max, value, onChange, label }: { min: number; max: number; value: number; onChange: (value: number) => void; label: string }) {
  const width = useRef(1);
  const origin = useRef(0);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const apply = (localX: number) => {
    const nextRatio = Math.min(1, Math.max(0, localX / width.current));
    onChange(Math.round(min + nextRatio * (max - min)));
  };
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      onLayout={(event) => {
        width.current = event.nativeEvent.layout.width || 1;
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        origin.current = event.nativeEvent.pageX - event.nativeEvent.locationX;
        apply(event.nativeEvent.locationX);
      }}
      onResponderMove={(event) => apply(event.nativeEvent.pageX - origin.current)}
      style={styles.hit}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: "center", marginHorizontal: 14 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: 6, backgroundColor: colors.accent },
  thumb: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, marginLeft: -14 },
});
