import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { categoryMeta, icons } from "../components/Icons";
import { PageHeader, PrimaryButton, Screen } from "../components/ui";
import { TODAY, longDate } from "../dates";
import { colors, radius } from "../theme";
import { useStore } from "../store";
import type { Category, ItemKind } from "../types";
import type { RootStackParamList } from "../routes";

const kinds: Array<{ kind: ItemKind; label: string; hint: string; Icon: typeof icons.Repeat2 }> = [
  { kind: "habit", label: "Habit", hint: "Repeats", Icon: icons.Repeat2 },
  { kind: "goal", label: "Task", hint: "Once", Icon: icons.CircleCheck },
  { kind: "deadline", label: "Deadline", hint: "A date", Icon: icons.CalendarClock },
];

const categories: Category[] = ["study", "fitness", "hygiene", "work", "personal", "other"];

export function CreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Create">>();
  const { addItem, showToast } = useStore();
  const [kind, setKind] = useState<ItemKind>(route.params?.kind ?? "habit");
  const [title, setTitle] = useState(route.params?.kind ? "" : "Drink water");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("hygiene");
  const [date, setDate] = useState(route.params?.date ?? TODAY);
  const [titleError, setTitleError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = () => {
    const missingTitle = title.trim().length === 0;
    const missingDate = kind === "deadline" && !date;
    setTitleError(missingTitle);
    setDateError(missingDate);
    if (missingTitle || missingDate || saving) return;
    setSaving(true);
    setTimeout(() => {
      addItem({
        title: title.trim(),
        kind,
        category,
        xp: kind === "deadline" ? 0 : kind === "habit" ? 10 : 20,
        money: kind !== "deadline",
        date,
      });
      showToast(kind === "deadline" ? "Deadline saved" : "Saved");
      navigation.goBack();
    }, 700);
  };

  const dateLabel = kind === "habit" ? "Starts" : "Due date";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 20 }}>
          <PageHeader title="Create" onBack={() => navigation.goBack()} />
          <View style={styles.types}>
            {kinds.map((choice) => {
              const on = choice.kind === kind;
              return (
                <Pressable key={choice.kind} onPress={() => setKind(choice.kind)} style={[styles.type, on && styles.typeOn]}>
                  <choice.Icon size={18} color={on ? colors.accent : colors.text} />
                  <Text style={[styles.typeLabel, on && { color: colors.accent }]}>{choice.label}</Text>
                  <Text style={styles.typeHint}>{choice.hint}</Text>
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
            <View style={[styles.input, styles.dateInput, dateError && styles.inputError]}>
              <Text style={{ flex: 1, color: date ? colors.text : colors.placeholder, fontSize: 14 }}>{date ? longDate(date) : ""}</Text>
              <icons.CalendarDays size={17} color={colors.secondary} />
            </View>
          </Field>
          {kind === "habit" ? (
            <Text style={styles.help}>A new occurrence appears each day. You can complete it once per day.</Text>
          ) : null}
        </View>
        <PrimaryButton label={saving ? "Saving" : kind === "habit" ? "Create habit" : kind === "goal" ? "Create task" : "Create deadline"} onPress={submit} disabled={saving} />
      </ScrollView>
    </Screen>
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
  typeOn: { borderColor: colors.accent, backgroundColor: "rgba(183,154,255,0.04)" },
  typeLabel: { color: colors.text, fontSize: 13, fontWeight: "700" },
  typeHint: { color: colors.muted, fontSize: 11 },
  label: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 14 },
  inputError: { borderColor: colors.streak },
  dateInput: { flexDirection: "row", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { borderColor: colors.accent, backgroundColor: "rgba(183,154,255,0.04)" },
  chipText: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  help: { color: colors.secondary, fontSize: 12, lineHeight: 19 },
  error: { color: colors.streak, fontSize: 12 },
});
