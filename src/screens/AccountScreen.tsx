import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInput as TextInputType } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { AvatarMark, PageHeader, Screen } from "../components/ui";
import { colors, inputReset, radius } from "../theme";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast, currentUser, renameUser, deleteAccount } = useStore();
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fieldRef = useRef<TextInputType>(null);

  const startEdit = () => {
    if (editing) return;
    setUsername(currentUser?.username ?? "");
    setNameError(false);
    setEditing(true);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  const saveUsername = async () => {
    if (!currentUser || saving) return;
    const next = username.trim();
    if (!next) {
      setNameError(true);
      return;
    }
    setSaving(true);
    try {
      await renameUser(next);
      setUsername(next);
      setEditing(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save the username", "error", "alert");
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      setDeleting(false);
      showToast(error instanceof Error ? error.message : "Could not delete the account", "error", "alert");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 20 }}>
          <PageHeader title="Account" onBack={() => navigation.goBack()} />
          <View style={styles.identity}>
            <AvatarMark
              icon={currentUser?.icon ?? null}
              initials={currentUser?.initials ?? "··"}
              size={64}
              textColor={currentUser ? colors.onAccent : colors.text}
              background={currentUser ? colors.accent : colors.surface}
            />
            <Text style={styles.name}>{currentUser?.username ?? "No profile"}</Text>
            <Text style={styles.meta}>{currentUser ? "Signed in on this device" : "Sign in to save a profile."}</Text>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Username</Text>
            <Pressable onPress={editing ? undefined : startEdit} style={[styles.input, styles.inputRow, editing && styles.inputOpen, nameError && styles.inputError]}>
              <TextInput
                ref={fieldRef}
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setNameError(false);
                }}
                onFocus={startEdit}
                editable={!saving}
                autoCapitalize="none"
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                underlineColorAndroid="transparent"
                style={styles.field}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={editing ? "Confirm username" : "Edit username"}
                hitSlop={8}
                disabled={saving}
                onPress={() => (editing ? void saveUsername() : startEdit())}
              >
                {editing ? <icons.Check size={17} color={colors.accent} /> : <icons.Pencil size={17} color={colors.secondary} />}
              </Pressable>
            </Pressable>
            {nameError ? <Text style={styles.error}>Add a username.</Text> : null}
            <Text style={styles.lockText}>Username is visible to friends.</Text>
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={styles.label}>Delete account</Text>
          {confirmDelete ? (
            <View style={styles.banner}>
              <icons.ShieldAlert size={19} color={colors.goalOpen} />
              <Text style={styles.bannerText}>This removes your profile, tasks, and friends.</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmDelete ? "Delete account forever" : "Delete account"}
            disabled={deleting}
            onPress={() => void removeAccount()}
            style={[styles.delete, deleting && { opacity: 0.7 }]}
          >
            <Text style={styles.deleteText}>{deleting ? "Deleting" : confirmDelete ? "Confirm delete" : "Delete account"}</Text>
          </Pressable>
          {confirmDelete ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel delete" onPress={() => setConfirmDelete(false)} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: "space-between", padding: 16, paddingBottom: 28, gap: 24 },
  identity: { alignItems: "center", gap: 8, paddingTop: 8 },
  name: { color: colors.text, fontSize: 22, fontWeight: "700" },
  meta: { color: colors.secondary, fontSize: 13 },
  label: { color: colors.secondary, fontSize: 12, fontWeight: "600" },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputOpen: { borderColor: colors.accent },
  inputError: { borderColor: colors.streak },
  field: { flex: 1, height: 48, color: colors.text, fontSize: 14, padding: 0, borderWidth: 0, ...inputReset },
  error: { color: colors.streak, fontSize: 12 },
  lockText: { color: colors.placeholder, fontSize: 12, lineHeight: 18 },
  banner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,77,77,0.09)", borderWidth: 1, borderColor: "rgba(255,77,77,0.25)" },
  bannerText: { flex: 1, color: colors.goalOpen, fontSize: 12, lineHeight: 19 },
  delete: { height: 46, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goalOpen, alignItems: "center", justifyContent: "center" },
  deleteText: { color: colors.goalOpen, fontSize: 15, fontWeight: "700" },
  cancel: { height: 46, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});
