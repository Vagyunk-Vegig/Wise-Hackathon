import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { categoryMeta, icons } from "../components/Icons";
import { TomorrowBanner, tomorrowQuotaFilled } from "../components/TomorrowBanner";
import { IconButton, PageHeader, PrimaryButton, Screen } from "../components/ui";
import { TODAY, isoDate, longDate, monthGrid, parts, shiftDate, shortDate } from "../dates";
import { colors, inputReset, radius } from "../theme";
import { useStore } from "../store";
import { Category, type ItemKind } from "../types";
import type { RootStackParamList } from "../routes";

const kinds: Array<{ kind: ItemKind; label: string; hint: string; Icon: typeof icons.Repeat2 }> = [
  { kind: "goal", label: "Daily goal", hint: "Once", Icon: icons.CircleCheck },
  { kind: "habit", label: "Habit", hint: "Repeats", Icon: icons.Repeat2 },
  { kind: "deadline", label: "Deadline", hint: "A date", Icon: icons.CalendarClock },
];

const categories = Object.values(Category);

export function CreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Create">>();
  const { addItem, showToast, items, dailyCount, onboardingComplete } = useStore();
  const tomorrow = shiftDate(TODAY, 1);
  const quotaFull = onboardingComplete && tomorrowQuotaFilled(items, dailyCount);
  const [kind, setKind] = useState<ItemKind>(route.params?.kind ?? "habit");
  const [title, setTitle] = useState(route.params?.kind ? "" : "Drink water");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(Category.Hygiene);
  const [date, setDate] = useState(route.params?.date ?? TODAY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const opened = parts(route.params?.date ?? TODAY);
  const [cursor, setCursor] = useState({ year: opened.year, month: opened.month });
  const [titleError, setTitleError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const taskLocked = kind === "goal";
  const submitDate = taskLocked ? tomorrow : date;
  const taskDisabled = taskLocked && quotaFull;

  const closePicker = () => setPickerOpen(false);

  const submit = async () => {
    const missingTitle = title.trim().length === 0;
    const missingDate = kind === "deadline" && !submitDate;
    setTitleError(missingTitle);
    setDateError(missingDate);
    if (missingTitle || missingDate || saving || taskDisabled) return;
    setSaving(true);
    try {
      await addItem({
        title: title.trim(),
        kind,
        category,
        xp: kind === "deadline" ? 0 : kind === "habit" ? 10 : 20,
        money: kind !== "deadline",
        date: submitDate,
        description: description.trim(),
      });
      showToast(savedLabel(kind, submitDate));
      navigation.goBack();
    } catch (error) {
      setSaving(false);
      showToast(error instanceof Error ? error.message : "Could not save", "error", "alert");
    }
  };

  const dateLabel = kind === "habit" ? "Starts" : "Due date";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 20 }}>
          <PageHeader title="Create" onBack={() => navigation.goBack()} />
          <TomorrowBanner
            stayVisible={taskLocked}
            pendingDate={taskLocked ? tomorrow : undefined}
            onPress={() => {
              if (quotaFull) return;
              setKind("goal");
              setPickerOpen(false);
            }}
          />
          <View style={styles.types}>
            {kinds.map((choice) => {
              const on = choice.kind === kind;
              const locked = choice.kind === "goal" && quotaFull;
              return (
                <Pressable
                  key={choice.kind}
                  onPress={() => {
                    if (locked) return;
                    setKind(choice.kind);
                    if (choice.kind === "goal") setPickerOpen(false);
                  }}
                  disabled={locked}
                  style={[styles.type, on && styles.typeOn, locked && styles.typeLocked]}
                >
                  <choice.Icon size={18} color={on ? colors.accent : colors.text} />
                  <Text style={[styles.typeLabel, on && { color: colors.accent }]}>{choice.label}</Text>
                  <Text style={styles.typeHint}>{locked ? "Quota filled" : choice.hint}</Text>
                </Pressable>
              );
            })}
          </View>
          <Field label="Title" error={titleError ? "Add a title." : undefined}>
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setTitleError(false);
              }}
              placeholder=""
              placeholderTextColor={colors.placeholder}
              style={[styles.input, titleError && styles.inputError]}
            />
          </Field>
          <Field label="Description">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />
          </Field>
          <Field label="Category">
            <View style={styles.chips}>
              {categories.map((key) => {
                const meta = categoryMeta[key];
                const on = key === category;
                return (
                  <Pressable key={key} onPress={() => setCategory(key)} style={[styles.chip, on && styles.chipOn]}>
                    <meta.Icon size={13} color={on ? colors.accent : colors.secondary} />
                    <Text style={[styles.chipText, on && { color: colors.accent }]}>{key[0].toUpperCase() + key.slice(1)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
          <Field label={dateLabel} error={dateError ? "Choose a due date." : undefined}>
            <Pressable
              disabled={taskLocked}
              onPress={() => {
                const current = parts(date);
                setCursor({ year: current.year, month: current.month });
                setPickerOpen((open) => !open);
                setDateError(false);
              }}
              style={[styles.input, styles.dateInput, dateError && styles.inputError, pickerOpen && styles.dateOpen, taskLocked && styles.dateLocked]}
            >
              <Text style={{ flex: 1, color: submitDate ? colors.text : colors.placeholder, fontSize: 14 }}>{submitDate ? longDate(submitDate) : ""}</Text>
              {taskLocked ? null : <icons.CalendarDays size={17} color={pickerOpen ? colors.accent : colors.secondary} />}
            </Pressable>
          </Field>
          {kind === "habit" ? (
            <Text style={styles.help}>A new occurrence appears each day. You can complete it once per day.</Text>
          ) : null}
        </View>
        <PrimaryButton
          label={saving ? "Saving" : taskDisabled ? "Quota filled" : kind === "habit" ? "Create habit" : kind === "goal" ? "Create daily goal" : "Create deadline"}
          onPress={submit}
          disabled={saving || taskDisabled}
        />
      </ScrollView>
      {pickerOpen ? (
        <View style={styles.sheetRoot} pointerEvents="box-none">
          <Pressable style={styles.sheetBackdrop} onPress={closePicker} accessibilityRole="button" accessibilityLabel="Close calendar" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <DatePicker
              cursor={cursor}
              selected={date}
              onShift={(delta) =>
                setCursor((current) => {
                  const next = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
                  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
                })
              }
              onSelect={(iso) => {
                setDate(iso);
                setPickerOpen(false);
                setDateError(false);
              }}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function savedLabel(kind: ItemKind, date: string) {
  const name = kind === "deadline" ? "Deadline" : kind === "habit" ? "Habit" : "Daily goal";
  if (date === TODAY) return `${name} saved for today`;
  if (date === shiftDate(TODAY, 1)) return `${name} saved for tomorrow`;
  return `${name} saved for ${shortDate(date)}`;
}

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function DatePicker({
  cursor,
  selected,
  onShift,
  onSelect,
}: {
  cursor: { year: number; month: number };
  selected: string;
  onShift: (delta: number) => void;
  onSelect: (iso: string) => void;
}) {
  const cells = monthGrid(cursor.year, cursor.month);
  const monthName = new Date(Date.UTC(cursor.year, cursor.month - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <View style={styles.picker}>
      <View style={styles.month}>
        <IconButton onPress={() => onShift(-1)}>
          <icons.ChevronLeft size={18} color={colors.text} />
        </IconButton>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <IconButton onPress={() => onShift(1)}>
          <icons.ChevronRight size={18} color={colors.text} />
        </IconButton>
      </View>
      <View style={styles.week}>
        {WEEK.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekText}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.cell} />;
          const iso = isoDate(cursor.year, cursor.month, day);
          const isSelected = iso === selected;
          return (
            <Pressable key={iso} onPress={() => onSelect(iso)} style={[styles.cell, isSelected && styles.cellSelected, iso === TODAY && !isSelected && styles.cellToday]}>
              <Text style={[styles.cellText, isSelected && { color: colors.onAccent }]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: "space-between", padding: 16, paddingBottom: 28, gap: 24 },
  types: { flexDirection: "row", gap: 8 },
  type: { flex: 1, height: 92, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 5 },
  typeOn: { borderColor: colors.accent, backgroundColor: "rgba(182,255,112,0.08)" },
  typeLocked: { opacity: 0.45 },
  dateLocked: { opacity: 0.7 },
  typeLabel: { color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "center" },
  typeHint: { color: colors.muted, fontSize: 11 },
  label: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 14, ...inputReset },
  inputError: { borderColor: colors.streak },
  dateInput: { flexDirection: "row", alignItems: "center" },
  dateOpen: { borderColor: colors.accent },
  sheetRoot: { ...StyleSheet.absoluteFill, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  picker: { gap: 8 },
  month: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  week: { flexDirection: "row" },
  weekText: { flex: 1, textAlign: "center", color: colors.placeholder, fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },
  cell: { width: `${100 / 7}%`, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  cellToday: { borderWidth: 1.5, borderColor: colors.accent },
  cellSelected: { backgroundColor: colors.accent },
  cellText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { borderColor: colors.accent, backgroundColor: "rgba(182,255,112,0.08)" },
  chipText: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  help: { color: colors.secondary, fontSize: 12, lineHeight: 19 },
  error: { color: colors.streak, fontSize: 12 },
});
