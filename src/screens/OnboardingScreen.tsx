import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "../components/Icons";
import { SnapSlider } from "../components/SnapSlider";
import { Screen } from "../components/ui";
import { useStore } from "../store";
import { colors, radius } from "../theme";

type Step = "welcome" | "create" | "signin" | "intro" | "habits" | "penalty" | "reminder" | "ready";

const placeholders = ["Finish the report", "Call the dentist", "Buy groceries", "Read for 20 minutes", "Plan tomorrow", "Take a walk"];
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

function money(amount: number) {
  return `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(amount)} Ft`;
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { signedIn, signIn, signUp, signInWithGoogle, signOut, finishOnboarding, showToast, onboardingReplay } = useStore();
  const [step, setStep] = useState<Step>("welcome");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [penalty, setPenalty] = useState(800);
  const [dailyCount, setDailyCount] = useState(3);
  const [habits, setHabits] = useState(["", "", ""]);
  const [reminders, setReminders] = useState(true);
  const [nudgeMinutes, setNudgeMinutes] = useState(17 * 60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (onboardingReplay) return;
    if (signedIn && (step === "welcome" || step === "create" || step === "signin")) setStep("intro");
  }, [signedIn, step, onboardingReplay]);

  const filledHabits = habits.map((habit) => habit.trim()).filter(Boolean);
  const accountReady = username.trim().length > 0 && email.includes("@") && password.length >= 6;
  const signInReady = email.includes("@") && password.length >= 6;

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong", "error", "alert");
    } finally {
      setBusy(false);
    }
  };

  const chooseCount = (next: number) => {
    setDailyCount(next);
    setHabits((current) => Array.from({ length: next }, (_, index) => current[index] ?? ""));
  };

  const back = () => {
    if (step === "create" || step === "signin") setStep("welcome");
    else if (step === "intro") {
      if (signedIn && !onboardingReplay) void run(async () => { await signOut(); setStep("welcome"); });
      else setStep("welcome");
    } else if (step === "habits") setStep("intro");
    else if (step === "penalty") setStep("habits");
    else if (step === "reminder") setStep("penalty");
    else if (step === "ready") setStep("reminder");
  };

  const stepLabel = step === "intro" ? "1 of 4" : step === "habits" ? "2 of 4" : step === "penalty" ? "3 of 4" : step === "reminder" ? "4 of 4" : "";
  const tasksReady = habits.length === dailyCount && habits.every((habit) => habit.trim().length > 0);

  return (
    <Screen>
      <View style={[styles.page, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step === "welcome" ? null : (
          <View style={styles.top}>
            <Pressable onPress={back} style={styles.back} accessibilityLabel="Back">
              <icons.ChevronLeft size={18} color={colors.text} />
            </Pressable>
            {stepLabel ? (
              <Text style={styles.stepCount}>{stepLabel}</Text>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>
        )}
        {step === "welcome" ? (
          <View style={styles.welcomeWrap}>
            <Welcome />
          </View>
        ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === "create" ? (
            <Account
              title="Create account"
              username={username}
              email={email}
              password={password}
              showPassword={showPassword}
              onUsername={setUsername}
              onEmail={setEmail}
              onPassword={setPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          ) : null}
          {step === "signin" ? (
            <Account
              title="Sign in"
              email={email}
              password={password}
              showPassword={showPassword}
              onEmail={setEmail}
              onPassword={setPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          ) : null}
          {step === "intro" ? <Intro count={dailyCount} onChange={chooseCount} /> : null}
          {step === "habits" ? <Habits values={habits} onChange={setHabits} /> : null}
          {step === "penalty" ? <Penalty amount={penalty} onChange={setPenalty} /> : null}
          {step === "reminder" ? <Reminder minutes={nudgeMinutes} onChange={setNudgeMinutes} /> : null}
          {step === "ready" ? <Ready amount={penalty} dailyCount={dailyCount} habits={filledHabits} reminders={reminders} nudgeTime={formatTime(nudgeMinutes)} /> : null}
        </ScrollView>
        )}
        <View style={styles.actions}>
          {step === "welcome" ? (
            <>
              <Pressable style={styles.primary} disabled={busy} onPress={() => (signedIn && onboardingReplay ? setStep("intro") : run(signInWithGoogle))}>
                <Text style={styles.g}>G</Text>
                <Text style={styles.primaryText}>Continue with Google</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => setStep("create")}>
                <Text style={styles.secondaryText}>Continue with email</Text>
              </Pressable>
              <Pressable style={styles.textButton} onPress={() => setStep("signin")}>
                <Text style={styles.textButtonLabel}>I already have an account</Text>
              </Pressable>
            </>
          ) : null}
          {step === "create" ? (
            <>
              <Pressable
                style={[styles.primary, !accountReady && styles.disabled]}
                disabled={!accountReady || busy}
                onPress={() => (signedIn && onboardingReplay ? setStep("intro") : run(() => signUp(email.trim(), password, username.trim())))}
              >
                <Text style={[styles.primaryText, !accountReady && styles.disabledText]}>Sign up</Text>
              </Pressable>
              <Pressable style={styles.textButton} onPress={() => setStep("signin")}>
                <Text style={styles.textButtonLabel}>Sign in</Text>
              </Pressable>
            </>
          ) : null}
          {step === "signin" ? (
            <>
              <Pressable
                style={[styles.primary, !signInReady && styles.disabled]}
                disabled={!signInReady || busy}
                onPress={() => (signedIn && onboardingReplay ? setStep("intro") : run(async () => { await signIn(email.trim(), password); if (onboardingReplay) setStep("intro"); }))}
              >
                <Text style={[styles.primaryText, !signInReady && styles.disabledText]}>Sign in</Text>
              </Pressable>
              <Pressable style={styles.textButton} onPress={() => setStep("create")}>
                <Text style={styles.textButtonLabel}>Create account</Text>
              </Pressable>
            </>
          ) : null}
          {step === "intro" ? (
            <Pressable style={styles.primary} onPress={() => setStep("habits")}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          ) : null}
          {step === "habits" ? (
            <>
              <Pressable style={[styles.primary, !tasksReady && styles.disabled]} disabled={!tasksReady} onPress={() => setStep("penalty")}>
                <Text style={[styles.primaryText, !tasksReady && styles.disabledText]}>Continue</Text>
              </Pressable>
              <Pressable style={styles.textButton} onPress={() => setStep("penalty")}>
                <Text style={styles.textButtonLabel}>Skip</Text>
              </Pressable>
            </>
          ) : null}
          {step === "penalty" ? (
            <Pressable style={styles.primary} onPress={() => setStep("reminder")}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          ) : null}
          {step === "reminder" ? (
            <>
              <Pressable style={styles.primary} onPress={() => { setReminders(true); setStep("ready"); }}>
                <Text style={styles.primaryText}>Allow reminders</Text>
              </Pressable>
              <Pressable style={styles.textButton} onPress={() => { setReminders(false); setStep("ready"); }}>
                <Text style={styles.textButtonLabel}>Not now</Text>
              </Pressable>
            </>
          ) : null}
          {step === "ready" ? (
            <Pressable
              style={styles.primary}
              disabled={busy}
              onPress={() => run(() => finishOnboarding({ penaltyFt: penalty, habits: filledHabits, reminders, dailyCount, nudgeTime: formatTime(nudgeMinutes) }))}
            >
              <Text style={styles.primaryText}>Start.</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function Welcome() {
  return (
    <View style={styles.welcome}>
      <Text style={styles.mark}>
        habit<Text style={styles.period}>.</Text>
      </Text>
      <Text style={styles.headline}>An open habit is money still at risk.</Text>
      <View style={styles.dashes}>
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={styles.dash} />
      </View>
    </View>
  );
}

function Account({
  title,
  username,
  email,
  password,
  showPassword,
  onUsername,
  onEmail,
  onPassword,
  onToggle,
}: {
  title: string;
  username?: string;
  email: string;
  password: string;
  showPassword: boolean;
  onUsername?: (value: string) => void;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.title}>{title}</Text>
      {onUsername ? <Field label="Username" value={username ?? ""} placeholder="mina" onChange={onUsername} /> : null}
      <Field label="Email" value={email} placeholder="mina@example.com" onChange={onEmail} keyboard="email-address" />
      <Field label="Password" value={password} placeholder="At least 6 characters" onChange={onPassword} secure={!showPassword} onToggle={onToggle} />
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  secure,
  onToggle,
  keyboard,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  secure?: boolean;
  onToggle?: () => void;
  keyboard?: "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secure}
          autoCapitalize="none"
          keyboardType={keyboard}
          style={styles.input}
        />
        {onToggle ? (
          <Pressable onPress={onToggle} hitSlop={8} accessibilityLabel={secure ? "Show password" : "Hide password"}>
            {secure ? <icons.EyeOff size={18} color={colors.secondary} /> : <icons.Eye size={18} color={colors.secondary} />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Tracks({ filled }: { filled: number }) {
  return (
    <View style={styles.tracks}>
      {[0, 1, 2, 3].map((index) => (
        <View key={index} style={[styles.track, index < filled && styles.trackOn]} />
      ))}
    </View>
  );
}

function Intro({ count, onChange }: { count: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.form}>
      <Tracks filled={1} />
      <Text style={styles.title}>Daily goals</Text>
      <Text style={styles.body}>We force you to do a set amount of daily goals</Text>
      <Text style={styles.sliderValue}>{count}</Text>
      <Text style={styles.label}>Tasks per day</Text>
      <SnapSlider min={0} max={6} value={count} onChange={onChange} label="Tasks per day" />
      <View style={styles.sliderEnds}>
        <Text style={styles.note}>0</Text>
        <Text style={styles.note}>6</Text>
      </View>
    </View>
  );
}

function Penalty({ amount, onChange }: { amount: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.form}>
      <Tracks filled={3} />
      <Text style={styles.title}>Set your daily penalty.</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepperButton} onPress={() => onChange(Math.max(100, amount - 100))} accessibilityLabel="Decrease penalty">
          <icons.Minus size={18} color={colors.text} />
        </Pressable>
        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.unit}>Ft</Text>
        </View>
        <Pressable style={styles.stepperButton} onPress={() => onChange(amount + 100)} accessibilityLabel="Increase penalty">
          <icons.Plus size={18} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.underline} />
      <Text style={styles.body}>For each missed money habit or task, not a flat daily fee. Settled at 00:00 Europe/Budapest. Deadlines are not charged.</Text>
      <Text style={styles.note}>This sets the rule. No money is moved here.</Text>
    </View>
  );
}

function Habits({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const count = values.filter((value) => value.trim()).length;
  return (
    <View style={styles.form}>
      <Tracks filled={2} />
      <Text style={styles.title}>Tasks to start with.</Text>
      <Text style={styles.body}>A task is the main thing. A habit or a deadline counts too.</Text>
      <View style={styles.habitHead}>
        <Text style={styles.label}>Tasks</Text>
        <Text style={styles.label}>{count}/{values.length}</Text>
      </View>
      {values.length === 0 ? <Text style={styles.body}>No tasks today. You can add some later.</Text> : null}
      {values.map((value, index) => (
        <TextInput
          key={`task-${index}`}
          value={value}
          onChangeText={(next) => onChange(values.map((current, currentIndex) => (currentIndex === index ? next : current)))}
          placeholder={placeholders[index] ?? "Task"}
          placeholderTextColor={colors.placeholder}
          style={styles.habitInput}
        />
      ))}
    </View>
  );
}

function Reminder({ minutes, onChange }: { minutes: number; onChange: (value: number) => void }) {
  const time = formatTime(minutes);
  return (
    <View style={styles.form}>
      <Tracks filled={4} />
      <Text style={styles.title}>A nudge for tomorrow.</Text>
      <Text style={styles.time}>{time}</Text>
      <SnapSlider min={0} max={47} value={minutes / 30} onChange={(slot) => onChange(slot * 30)} label="Nudge time" />
      <View style={styles.sliderEnds}>
        <Text style={styles.note}>00:00</Text>
        <Text style={styles.note}>23:30</Text>
      </View>
      <View style={styles.presets}>
        {timePresets.map((preset) => {
          const on = preset.minutes === minutes;
          return (
            <Pressable key={preset.label} onPress={() => onChange(preset.minutes)} style={[styles.preset, on && styles.presetOn]}>
              <Text style={[styles.presetLabel, on && styles.presetLabelOn]}>{preset.label}</Text>
              <Text style={[styles.presetTime, on && styles.presetLabelOn]}>{formatTime(preset.minutes)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.body}>{`If tomorrow's tasks are not all in place around ${time}, Today and Create still show a warning.`}</Text>
      <Text style={styles.note}>This saves the time. No reminder is sent yet.</Text>
    </View>
  );
}

function Ready({ amount, dailyCount, habits, reminders, nudgeTime }: { amount: number; dailyCount: number; habits: string[]; reminders: boolean; nudgeTime: string }) {
  return (
    <View style={styles.form}>
      <Text style={styles.title}>You're ready.</Text>
      <View style={styles.ready}>
        <View style={styles.readyRow}>
          <Text style={styles.readyLabel}>Tasks per day</Text>
          <Text style={styles.readyValue}>{dailyCount}</Text>
        </View>
        <View style={styles.divider} />
        {habits.length === 0 ? (
          <View style={styles.readyRow}>
            <Text style={styles.readyLabel}>Tasks</Text>
            <Text style={styles.readyValue}>Skipped</Text>
          </View>
        ) : (
          habits.map((habit) => (
            <View key={habit} style={styles.readyRow}>
              <icons.Check size={16} color={colors.accent} />
              <Text style={styles.readyHabit}>{habit}</Text>
            </View>
          ))
        )}
        <View style={styles.divider} />
        <View style={styles.readyRow}>
          <Text style={styles.readyLabel}>Daily penalty</Text>
          <Text style={styles.readyValue}>{money(amount)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.readyRow}>
          <Text style={styles.readyLabel}>Nudge</Text>
          <Text style={styles.readyValue}>{reminders ? nudgeTime : "Off"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24 },
  top: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  stepCount: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  scroll: { flexGrow: 1, paddingTop: 12, paddingBottom: 8 },
  welcomeWrap: { flex: 1, justifyContent: "flex-end", paddingBottom: 28 },
  welcome: { gap: 20 },
  mark: { color: colors.text, fontSize: 80, fontWeight: "700", letterSpacing: -2, lineHeight: 84 },
  period: { color: colors.accent },
  headline: { color: colors.text, fontSize: 34, fontWeight: "700", letterSpacing: -0.6, lineHeight: 40 },
  dashes: { flexDirection: "row", gap: 6, marginTop: 8 },
  dash: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dashOn: { backgroundColor: colors.accent },
  form: { gap: 16, paddingTop: 8 },
  title: { color: colors.text, fontSize: 34, fontWeight: "700", letterSpacing: -0.6, lineHeight: 40 },
  field: { gap: 8 },
  label: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  inputRow: { height: 50, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, color: colors.text, fontSize: 16 },
  tracks: { flexDirection: "row", gap: 6 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  trackOn: { backgroundColor: colors.accent },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  stepperButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  amountWrap: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  amount: { color: colors.text, fontSize: 56, fontWeight: "700", lineHeight: 60 },
  unit: { color: colors.text, fontSize: 28, fontWeight: "700", marginBottom: 6 },
  underline: { height: 1, backgroundColor: colors.border, marginTop: -4 },
  body: { color: colors.secondary, fontSize: 14, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  sliderValue: { color: colors.text, fontSize: 56, fontWeight: "700", lineHeight: 60, textAlign: "center" },
  sliderEnds: { flexDirection: "row", justifyContent: "space-between", marginTop: -8 },
  presets: { flexDirection: "row", gap: 8 },
  preset: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 },
  presetOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  presetLabel: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  presetTime: { color: colors.text, fontSize: 12, fontWeight: "700" },
  presetLabelOn: { color: colors.onAccent },
  habitHead: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  habitInput: { height: 50, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  reminderCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16 },
  bell: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  time: { color: colors.text, fontSize: 40, fontWeight: "700" },
  ready: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  readyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  readyLabel: { color: colors.secondary, fontSize: 14 },
  readyValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  readyHabit: { flex: 1, color: colors.text, fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.border },
  actions: { gap: 12, paddingTop: 12 },
  primary: { height: 50, borderRadius: 14, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
  g: { color: colors.onAccent, fontSize: 20, fontWeight: "700" },
  secondary: { height: 50, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  textButton: { height: 44, alignItems: "center", justifyContent: "center" },
  textButtonLabel: { color: colors.secondary, fontSize: 15, fontWeight: "600" },
  disabled: { backgroundColor: colors.elevated },
  disabledText: { color: colors.placeholder },
});
