import { useWindowDimensions, Animated, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { wheelSvg } from "./wheelSvg";

const FRAME_W = 358;
const FRAME_H = 360;
const DISC = 334;

const labels = [
  { text: "ALL", color: "#C5F467", size: 19, left: 183.5, top: 64.07 },
  { text: "50%", color: "#E1B482", size: 19, left: 236, top: 155 },
  { text: "MISS", color: "#8E9FA6", size: 14, left: 183.5, top: 245.93 },
  { text: "25%", color: "#9CCDDC", size: 19, left: 78.5, top: 245.93 },
  { text: "50%", color: "#D9A6C5", size: 19, left: 26, top: 155 },
  { text: "MISS", color: "#8E9FA6", size: 14, left: 78.5, top: 64.07 },
];

const slices = [
  { key: "slice-0", left: 158, top: 0, width: 136.832, height: 158 },
  { key: "slice-1", left: 158, top: 79, width: 158, height: 158 },
  { key: "slice-2", left: 158, top: 158, width: 136.832, height: 158 },
  { key: "slice-3", left: 21.172, top: 158, width: 136.832, height: 158 },
  { key: "slice-4", left: 0, top: 79, width: 158, height: 158 },
  { key: "slice-5", left: 21.172, top: 0, width: 136.832, height: 158 },
] as const;

function Art({ name, width, height }: { name: keyof typeof wheelSvg; width: number; height: number }) {
  return <SvgXml xml={wheelSvg[name]} width={width} height={height} />;
}

export function FortuneWheel({ rotation }: { rotation: Animated.Value }) {
  const { width } = useWindowDimensions();
  const scale = Math.min(1, (width - 32) / FRAME_W);
  const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] });

  return (
    <View style={{ width: FRAME_W * scale, height: FRAME_H * scale, alignSelf: "center" }}>
      <View style={[styles.frame, { transform: [{ scale }], transformOrigin: "top left" }]}>
        <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
          <View style={styles.rimOuter}>
            <Art name="rim-outer" width={334} height={334} />
          </View>
          <View style={styles.rimInner}>
            <Art name="rim-inner" width={322} height={322} />
          </View>
          <View style={styles.slices}>
            {slices.map((slice) => (
              <View key={slice.key} style={{ position: "absolute", left: slice.left, top: slice.top, width: slice.width, height: slice.height }}>
                <Art name={slice.key} width={slice.width} height={slice.height} />
              </View>
            ))}
          </View>
          {labels.map((label) => (
            <Text key={`${label.text}-${label.left}`} style={[styles.label, { color: label.color, fontSize: label.size, left: label.left, top: label.top }]}>
              {label.text}
            </Text>
          ))}
          <View style={styles.hubRim}>
            <Art name="hub-rim" width={66} height={66} />
          </View>
          <View style={styles.hub}>
            <Art name="hub" width={52} height={52} />
          </View>
          <View style={styles.spark}>
            <Art name="spark" width={20} height={20} />
          </View>
        </Animated.View>
        <View style={styles.pointer}>
          <Art name="pointer" width={24} height={32} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: FRAME_W, height: FRAME_H },
  disc: { position: "absolute", left: 12, top: 18, width: DISC, height: DISC },
  rimOuter: { position: "absolute", left: 0, top: 0, width: 334, height: 334 },
  rimInner: { position: "absolute", left: 6, top: 6, width: 322, height: 322 },
  slices: { position: "absolute", left: 9, top: 9, width: 316, height: 316 },
  label: { position: "absolute", width: 72, height: 24, lineHeight: 24, textAlign: "center", fontWeight: "700" },
  hubRim: { position: "absolute", left: 134, top: 134, width: 66, height: 66 },
  hub: { position: "absolute", left: 141, top: 141, width: 52, height: 52 },
  spark: { position: "absolute", left: 157, top: 157, width: 20, height: 20 },
  pointer: { position: "absolute", left: 167, top: 8, width: 24, height: 32, zIndex: 2 },
});
