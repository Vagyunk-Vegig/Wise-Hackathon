import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SvgXml } from "react-native-svg";
import { FortuneWheel } from "../components/FortuneWheel";
import { wheelSvg } from "../components/wheelSvg";
import { icons } from "../components/Icons";
import { IconButton, Screen } from "../components/ui";
import { ftLabel, shortDate } from "../dates";
import { colors } from "../theme";
import { useStore } from "../store";
import { restRotationForSlice, sliceIndexForPrize, spinRotationForSlice } from "../wheel";
import type { RootStackParamList } from "../routes";

export function WheelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canSpinWheel, spinWheel, wheelThisWeek, yesterdayLostFt, nextWheelDate, wheelDaysLeft } = useStore();
  const rotation = useRef(new Animated.Value(wheelThisWeek ? restRotationForSlice(sliceIndexForPrize(wheelThisWeek.prizeId)) : 0)).current;
  const [busy, setBusy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const result = wheelThisWeek;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const spin = () => {
    if (busy || !canSpinWheel) return;
    const record = spinWheel();
    if (!record) return;
    const index = sliceIndexForPrize(record.prizeId);
    setBusy(true);
    if (reduceMotion) {
      rotation.setValue(restRotationForSlice(index));
      setBusy(false);
      return;
    }
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue: spinRotationForSlice(index),
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setBusy(false));
  };

  const recharge =
    result == null
      ? "You can spin only if yesterday had lost Ft."
      : wheelDaysLeft === 1
        ? `Recharges tomorrow · ${shortDate(nextWheelDate)}`
        : `Recharges in ${wheelDaysLeft} days · ${shortDate(nextWheelDate)}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <IconButton onPress={() => navigation.goBack()}>
          <icons.ChevronLeft size={18} color={colors.text} />
        </IconButton>
        <View style={styles.intro}>
          <Text style={styles.title}>Fortune wheel</Text>
          <Text style={styles.lead}>Spin for your reward.</Text>
        </View>
        <View style={styles.amounts}>
          <View style={styles.amount} accessibilityLabel={`Yesterday lost ${ftLabel(yesterdayLostFt)}`}>
            <Text style={styles.amountText}>{ftLabel(yesterdayLostFt)}</Text>
          </View>
          <View style={styles.amount} accessibilityLabel={`Recovered ${ftLabel(result?.recoveredFt ?? 0)}`}>
            <Text style={styles.amountText}>{ftLabel(result?.recoveredFt ?? 0)}</Text>
          </View>
        </View>
        <View style={styles.stage}>
          <FortuneWheel rotation={rotation} />
          {canSpinWheel || busy ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Spin" onPress={spin} disabled={busy} style={[styles.spin, busy && { opacity: 0.7 }]}>
              <SvgXml xml={wheelSvg.rotate} width={18} height={18} />
              <Text style={styles.spinText}>{busy ? "Spinning…" : "Spin"}</Text>
            </Pressable>
          ) : (
            <View style={styles.locked}>
              <Text style={styles.lockedText}>{recharge}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 24 },
  intro: { gap: 8 },
  title: { color: "#F3F7F8", fontSize: 27, fontWeight: "700", lineHeight: 32 },
  lead: { color: "#A6B4B9", fontSize: 14, lineHeight: 21 },
  amounts: { flexDirection: "row", gap: 12 },
  amount: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#121B1E",
    borderWidth: 1,
    borderColor: "#29363A",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  amountText: { color: "#F3F7F8", fontSize: 26, fontWeight: "700" },
  stage: { gap: 16 },
  spin: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#C5F467",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinText: { color: "#19250C", fontSize: 15, fontWeight: "700" },
  locked: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#121B1E",
    borderWidth: 1,
    borderColor: "#29363A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  lockedText: { color: "#A6B4B9", fontSize: 14, fontWeight: "700", textAlign: "center" },
});
