import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { SnapSlider } from "../components/SnapSlider";
import { PageHeader, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { colors } from "../theme";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

export function CommitmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { commitmentOn, setCommitment, showToast, penaltyFt, dailyCount, fixedHabits, remindersOn, nudgeTime, updateOnboarding } = useStore();
  const [penalty, setPenalty] = useState(penaltyFt);
  const [count, setCount] = useState(dailyCount);
  const [saving, setSaving] = useState(false);
  const rules = [
    ["Amount", `${penalty} Ft / missed task`],
    ["Tasks per day", String(count)],
    ["Destination", "Charity · saved"],
    ["Eligible", "Work tasks"],
    ["Cutoff", "23:59 · Budapest"],
  ];

  const enable = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateOnboarding({
        penaltyFt: penalty,
        habits: fixedHabits,
        reminders: remindersOn,
        dailyCount: count,
        nudgeTime,
      });
      setCommitment(true);
      showToast("Calculation on. No money moves in this build.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save", "error", "alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ gap: 20 }}>
          <PageHeader title="Commitment" onBack={() => navigation.goBack()} />
          <View style={styles.banner}>
            <icons.ShieldAlert size={19} color={colors.streak} />
            <Text style={styles.bannerText}>
              {commitmentOn ? "Calculation is on. No money moves in this build." : "Off until you review and confirm. No money moves in this build."}
            </Text>
          </View>
          <View>
            {rules.map(([label, value]) => (
              <View key={label} style={styles.rule}>
                <Text style={styles.ruleLabel}>{label}</Text>
                <Text style={styles.ruleValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.adjust}>
            <Text style={styles.adjustValue}>{count}</Text>
            <Text style={styles.adjustLabel}>Tasks per day</Text>
            <SnapSlider min={0} max={6} value={count} onChange={setCount} label="Tasks per day" />
            <View style={styles.ends}>
              <Text style={styles.adjustLabel}>0</Text>
              <Text style={styles.adjustLabel}>6</Text>
            </View>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.step} onPress={() => setPenalty((current) => Math.max(100, current - 100))} accessibilityLabel="Decrease penalty">
              <icons.Minus size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.penalty}>{penalty} Ft</Text>
            <Pressable style={styles.step} onPress={() => setPenalty((current) => current + 100)} accessibilityLabel="Increase penalty">
              <icons.Plus size={18} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>At risk tonight</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{penalty} Ft</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Finish project report is still open</Text>
          </View>
          {["Charged per missed task, not a flat fee.", "You can pause before the cutoff.", "A transfer is never shown as paid early."].map((line) => (
            <Text key={line} style={styles.bullet}>{`•  ${line}`}</Text>
          ))}
          <View style={styles.lock}>
            <icons.LockKeyhole size={15} color={colors.placeholder} />
            <Text style={styles.lockText}>Money transfer · unavailable</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <PrimaryButton label={saving ? "Saving" : "Enable calculation"} onPress={enable} disabled={saving} />
          <SecondaryButton
            label="Keep off"
            onPress={() => {
              setCommitment(false);
              navigation.goBack();
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: "space-between", padding: 16, paddingBottom: 28, gap: 24 },
  banner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,159,67,0.09)", borderWidth: 1, borderColor: "rgba(255,159,67,0.25)" },
  bannerText: { flex: 1, color: colors.streak, fontSize: 12, lineHeight: 19 },
  rule: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  ruleLabel: { color: colors.secondary, fontSize: 12 },
  ruleValue: { color: colors.text, fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  chip: { backgroundColor: "rgba(255,159,67,0.09)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { color: colors.streak, fontSize: 11, fontWeight: "700" },
  cardMeta: { color: colors.secondary, fontSize: 11 },
  bullet: { color: colors.secondary, fontSize: 11, lineHeight: 16 },
  lock: { height: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  lockText: { color: colors.placeholder, fontSize: 12 },
  adjust: { gap: 8 },
  adjustValue: { color: colors.text, fontSize: 40, fontWeight: "700", textAlign: "center" },
  adjustLabel: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  ends: { flexDirection: "row", justifyContent: "space-between" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  penalty: { color: colors.text, fontSize: 28, fontWeight: "700" },
});
