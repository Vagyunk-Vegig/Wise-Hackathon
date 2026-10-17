import { useEffect, useRef, useState, type ElementRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { colors, radius } from "../theme";
import { useStore } from "../store";

export function AuthScreen() {
  const { signIn, signInWithGoogle, showToast } = useStore();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const signUpMode = mode === "signUp";

  useEffect(() => {
    if (!formError) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [formError]);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || password.length < 6) {
      const message = "Use an email and a password of at least 6 characters.";
      setFormError(message);
      showToast(message, "error", "alert");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in";
      setFormError(message);
      showToast(message, "error", "alert");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not continue with Google";
      setFormError(message);
      showToast(message, "error", "alert");
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Text style={styles.mark}>habit.</Text>
          <Text style={styles.title}>{signUpMode ? "Create account" : "Sign in"}</Text>
          <Text style={styles.sub}>{signUpMode ? "Create your account with Google." : "Use Google, or the email and password for your account."}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" onPress={() => void google()} disabled={busy} style={[styles.google, busy && { opacity: 0.7 }]}>
          <Text style={styles.googleMark}>G</Text>
          <Text style={styles.googleText}>{busy ? "Working" : "Continue with Google"}</Text>
        </Pressable>
        {signUpMode ? null : (
          <>
            <Text style={styles.or}>or</Text>
            <View style={{ gap: 10 }}>
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={colors.placeholder} style={styles.input} />
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={colors.placeholder} style={styles.input} />
            </View>
          </>
        )}
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <View style={styles.actions}>
          {signUpMode ? null : <PrimaryButton label={busy ? "Working" : "Sign in"} disabled={busy} onPress={() => void submit()} />}
          <SecondaryButton
            label={signUpMode ? "I already have an account" : "Create account"}
            onPress={() => {
              setFormError(null);
              setMode(signUpMode ? "signIn" : "signUp");
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, padding: 16, paddingBottom: 28, gap: 24 },
  actions: { gap: 8, marginTop: "auto" },
  mark: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  title: { color: colors.text, fontSize: 32, fontWeight: "700" },
  sub: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 14 },
  error: { color: colors.streak, fontSize: 13, lineHeight: 18 },
  google: { height: 48, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  googleMark: { color: colors.accent, fontSize: 16, fontWeight: "800" },
  googleText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  or: { color: colors.muted, fontSize: 12, fontWeight: "700", textAlign: "center" },
});
