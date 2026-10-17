import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInput as TextInputType } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { categoryMeta, icons } from "../components/Icons";
import { PageHeader, Screen } from "../components/ui";
import { dueChip, longDate } from "../dates";
import { itemsForDate } from "../schedule";
import { colors, inputReset, radius } from "../theme";
import { useStore } from "../store";
import type { ItemKind } from "../types";
import type { RootStackParamList } from "../routes";

function kindLabel(kind: ItemKind) {
  if (kind === "goal") return "Daily goal";
  if (kind === "habit") return "Habit";
  return "Deadline";
}

function moneyChip(amount: number) {
  return `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(amount)} Ft`;
}

export function TaskDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "TaskDetail">>();
  const { items, penaltyFt, updateItemNote, showToast } = useStore();
  const source = items.find((item) => item.id === route.params.id);
  const shown = source ? itemsForDate([source], route.params.date)[0] ?? source : null;
  const meta = shown ? categoryMeta[shown.category] : null;
  const categoryName = shown ? shown.category[0].toUpperCase() + shown.category.slice(1) : "";
  const status = shown?.done ? "Done" : shown?.kind === "deadline" ? dueChip(shown.date) : "Open";
  const statusHot = status === "Due today" || status === "Overdue";
  const statusGood = status === "Done";
  const [note, setNote] = useState(shown?.note ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fieldRef = useRef<TextInputType>(null);

  useEffect(() => {
    setNote(shown?.note ?? "");
    setEditing(false);
  }, [shown?.id, shown?.note]);

  const startEdit = () => {
    if (editing || !shown) return;
    setNote(shown.note);
    setEditing(true);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  const saveNote = async () => {
    if (!shown || saving) return;
    setSaving(true);
    try {
      await updateItemNote(shown.id, note);
      setEditing(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save the description", "error", "alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <PageHeader title="Details" onBack={() => navigation.goBack()} />
        {shown && meta ? (
          <View style={{ gap: 24 }}>
            <View style={styles.hero}>
              <View style={[styles.tile, { backgroundColor: `${meta.color}17` }]}>
                <meta.Icon size={22} color={meta.color} />
              </View>
              <Text style={styles.title}>{shown.title}</Text>
              <Text style={styles.date}>{longDate(shown.date)}</Text>
            </View>
            <View style={styles.chips}>
              <View style={styles.chip}>
                <meta.Icon size={13} color={meta.color} />
                <Text style={styles.chipText}>{categoryName}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{kindLabel(shown.kind)}</Text>
              </View>
              {shown.xp > 0 ? (
                <View style={styles.chip}>
                  <Text style={[styles.chipText, { color: colors.accent }]}>+{shown.xp} XP</Text>
                </View>
              ) : null}
              {shown.money && shown.kind !== "deadline" ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{moneyChip(penaltyFt)}</Text>
                </View>
              ) : null}
              <View style={[styles.chip, statusGood && styles.chipOn, statusHot && styles.chipHot, status === "Overdue" && styles.chipBad]}>
                <Text
                  style={[
                    styles.chipText,
                    statusGood && { color: colors.accent },
                    status === "Due today" && { color: colors.due },
                    status === "Overdue" && { color: "#FF8ABF" },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardLabel}>Description</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={editing ? "Confirm description" : "Edit description"}
                  hitSlop={8}
                  disabled={saving}
                  onPress={() => (editing ? void saveNote() : startEdit())}
                >
                  {editing ? <icons.Check size={17} color={colors.accent} /> : <icons.Pencil size={17} color={colors.secondary} />}
                </Pressable>
              </View>
              {editing ? (
                <TextInput
                  ref={fieldRef}
                  value={note}
                  onChangeText={setNote}
                  editable={!saving}
                  multiline
                  placeholder="Optional"
                  placeholderTextColor={colors.placeholder}
                  underlineColorAndroid="transparent"
                  style={styles.noteInput}
                />
              ) : (
                <Pressable onPress={startEdit}>
                  <Text style={shown.note.trim() ? styles.note : styles.noteEmpty}>
                    {shown.note.trim() ? shown.note : "No description"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.missing}>This task is no longer available.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 28, gap: 24 },
  hero: { alignItems: "center", gap: 10, paddingTop: 8 },
  tile: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", textAlign: "center" },
  date: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: { height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { borderColor: colors.accent, backgroundColor: "rgba(182,255,112,0.08)" },
  chipHot: { borderColor: "transparent", backgroundColor: "rgba(255,107,107,0.09)" },
  chipBad: { backgroundColor: "rgba(255,138,191,0.14)" },
  chipText: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 14, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  note: { color: colors.text, fontSize: 14, lineHeight: 21 },
  noteEmpty: { color: colors.placeholder, fontSize: 14, lineHeight: 21 },
  noteInput: { minHeight: 88, color: colors.text, fontSize: 14, lineHeight: 21, padding: 0, textAlignVertical: "top", ...inputReset },
  missing: { color: colors.secondary, fontSize: 14, textAlign: "center", marginTop: 24 },
});
