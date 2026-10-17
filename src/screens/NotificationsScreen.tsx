import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SnapSlider } from "../components/SnapSlider";
import { PageHeader, PrimaryButton, Screen } from "../components/ui";
import { colors, radius } from "../theme";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

const timePresets = [
  { label: "Morning", minutes: 8 * 60 },
  { label: "Noon", minutes: 12 * 60 },
  { label: "Evening", minutes: 17 * 60 },
  { label: "Night", minutes: 21 * 60 },
];

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function minutesFrom(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 17 * 60;
  return hour * 60 + minute;
}

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast, penaltyFt, fixedHabits, dailyCount, nudgeTime, remindersOn, updateOnboarding } = useStore();
  const [minutes, setMinutes] = useState(minutesFrom(nudgeTime));
  const [reminders, setReminders] = useState(remindersOn);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateOnboarding({
        penaltyFt,
        habits: fixedHabits,
        reminders,
        dailyCount,
        nudgeTime: formatTime(minutes),
      });
      showToast(reminders ? `Nudge set for ${formatTime(minutes)}` : "Nudge off");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save", "error", "alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <PageHeader title="Notifications" onBack={() => navigation.goBack()} />
        <Text style={styles.time}>{formatTime(minutes)}</Text>
        <SnapSlider min={0} max={47} value={minutes / 30} onChange={(slot) => setMinutes(slot * 30)} label="Nudge time" />
        <View style={styles.ends}>
          <Text style={styles.caption}>00:00</Text>
          <Text style={styles.caption}>23:30</Text>
        </View>
        <View style={styles.presets}>
          {timePresets.map((preset) => {
            const on = preset.minutes === minutes;
            return (
              <Pressable key={preset.label} onPress={() => setMinutes(preset.minutes)} style={[styles.preset, on && styles.presetOn]}>
                <Text style={[styles.presetLabel, on && styles.presetOnText]}>{preset.label}</Text>
                <Text style={[styles.presetTime, on && styles.presetOnText]}>{formatTime(preset.minutes)}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.toggle}>
          <Pressable onPress={() => setReminders(true)} style={[styles.toggleSide, reminders && styles.toggleOn]}>
            <Text style={[styles.toggleText, reminders && styles.toggleTextOn]}>On</Text>
          </Pressable>
          <Pressable onPress={() => setReminders(false)} style={[styles.toggleSide, !reminders && styles.toggleOn]}>
            <Text style={[styles.toggleText, !reminders && styles.toggleTextOn]}>Off</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>This saves the nudge time. No reminder is sent yet.</Text>
        <PrimaryButton label={saving ? "Saving" : "Save"} onPress={save} disabled={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16, paddingBottom: 32 },
  time: { color: colors.text, fontSize: 48, fontWeight: "700", textAlign: "center" },
  ends: { flexDirection: "row", justifyContent: "space-between", marginTop: -8 },
  caption: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  presets: { flexDirection: "row", gap: 8 },
  preset: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 },
  presetOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  presetLabel: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  presetTime: { color: colors.text, fontSize: 12, fontWeight: "700" },
  presetOnText: { color: colors.onAccent },
  toggle: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 4 },
  toggleSide: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: colors.accent },
  toggleText: { color: colors.secondary, fontSize: 14, fontWeight: "700" },
  toggleTextOn: { color: colors.onAccent },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});
