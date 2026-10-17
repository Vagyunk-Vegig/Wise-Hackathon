import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FortuneWheel } from "../components/FortuneWheel";
import { icons } from "../components/Icons";
import { PageHeader, PrimaryButton, Screen } from "../components/ui";
import { ftLabel, shortDate } from "../dates";
import { colors } from "../theme";
import { useStore } from "../store";
import { prizeCopy, restRotationForSlice, sliceIndexForPrize, spinRotationForSlice, WHEEL_SLICES } from "../wheel";
import type { RootStackParamList } from "../routes";

export function WheelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canSpinWheel, spinWheel, wheelThisWeek, yesterdayLostFt, nextWheelDate, wheelDaysLeft } = useStore();
  const rotation = useRef(new Animated.Value(wheelThisWeek ? restRotationForSlice(sliceIndexForPrize(wheelThisWeek.prizeId)) : 0)).current;
  const [busy, setBusy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const result = wheelThisWeek;
  const locked = Boolean(result) && !canSpinWheel && !busy;
  const unlockLabel = shortDate(nextWheelDate);

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <PageHeader title="Weekly wheel" onBack={() => navigation.goBack()} />
        <Text style={styles.lead}>
          One spin every 7 days. Land on a slice to recover some or all of yesterday's missed-task penalty.
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Yesterday lost</Text>
            <Text style={styles.statValue}>{ftLabel(yesterdayLostFt)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Recovered</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{ftLabel(result?.recoveredFt ?? 0)}</Text>
          </View>
        </View>
        <View style={styles.wheelWrap}>
          <FortuneWheel size={300} rotation={rotation} locked={locked} daysLeft={wheelDaysLeft} unlockLabel={unlockLabel} />
        </View>
        {canSpinWheel || busy ? (
          <PrimaryButton label={busy ? "Spinning…" : "Spin"} onPress={spin} disabled={busy} />
        ) : (
          <View style={styles.lockedBar}>
            <View style={styles.lockedIcon}>
              <icons.LockKeyhole size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              {result ? (
                <>
                  <Text style={styles.lockedTitle}>
                    {wheelDaysLeft === 1 ? "Recharges tomorrow" : `Recharges in ${wheelDaysLeft} days`}
                  </Text>
                  <Text style={styles.lockedBody}>Next spin {unlockLabel}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.lockedTitle}>Nothing to recover</Text>
                  <Text style={styles.lockedBody}>You can spin only if yesterday had lost Ft.</Text>
                </>
              )}
            </View>
          </View>
        )}
        {result ? (
          <View style={styles.result}>
            <icons.Sparkles size={18} color={colors.accent} />
            <Text style={styles.resultTitle}>
              {result.share > 0 && result.recoveredFt > 0 ? `+${ftLabel(result.recoveredFt)}` : WHEEL_SLICES[sliceIndexForPrize(result.prizeId)]?.label ?? "MISS"}
            </Text>
            <Text style={styles.resultBody}>{prizeCopy(result.share, result.recoveredFt, result.lostFt)}</Text>
          </View>
        ) : (
          <View style={styles.note}>
            <icons.Gift size={16} color={colors.muted} />
            <Text style={styles.noteText}>
              {yesterdayLostFt > 0
                ? `Yesterday's unfinished money tasks add up to ${ftLabel(yesterdayLostFt)}.`
                : "Finish today's tasks so a miss tomorrow can still be recovered on the next spin."}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40, gap: 20 },
  lead: { color: colors.secondary, fontSize: 14, lineHeight: 21, marginTop: -8 },
  stats: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  wheelWrap: { alignItems: "center", paddingVertical: 12 },
  lockedBar: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: "rgba(182,255,112,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
  },
  lockedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  lockedBody: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  result: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  resultTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  resultBody: { color: colors.secondary, fontSize: 13, lineHeight: 20, textAlign: "center" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 4 },
  noteText: { flex: 1, color: colors.secondary, fontSize: 13, lineHeight: 20 },
});
