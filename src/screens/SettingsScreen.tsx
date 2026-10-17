import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { PageHeader, PrimaryButton, Screen } from "../components/ui";
import { colors, radius } from "../theme";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

const rows = [
  { key: "account", label: "Account", Icon: icons.UserRound },
  { key: "zone", label: "Time zone", Icon: icons.Globe },
  { key: "notes", label: "Notifications", Icon: icons.Bell },
  { key: "privacy", label: "Privacy", Icon: icons.Shield },
  { key: "commitment", label: "Commitment", Icon: icons.HandHeart },
  { key: "logout", label: "Log out", Icon: icons.LogOut },
] as const;

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showToast, signOut, currentUser, renameUser, deleteAccount } = useStore();
  const [accountOpen, setAccountOpen] = useState(false);
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveUsername = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      await renameUser(username);
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
        <PageHeader title="Settings" onBack={() => navigation.goBack()} />
        <View style={styles.card}>
          {rows.map((row, index) => (
            <View key={row.key}>
              <Pressable
                onPress={() => {
                  if (row.key === "commitment") navigation.navigate("Commitment");
                  else if (row.key === "notes") navigation.navigate("Notifications");
                  else if (row.key === "logout") {
                    void signOut().catch((error: unknown) => {
                      showToast(error instanceof Error ? error.message : "Could not sign out", "error", "alert");
                    });
                  } else if (row.key === "account") {
                    setUsername(currentUser?.username ?? "");
                    setConfirmDelete(false);
                    setAccountOpen((open) => !open);
                  } else showToast(`${row.label} stays on this device.`);
                }}
                style={[styles.row, index < rows.length - 1 && !(row.key === "account" && accountOpen) && styles.divider]}
              >
                <row.Icon size={18} color={colors.text} />
                <Text style={styles.label}>{row.label}</Text>
                <icons.ChevronRight size={16} color={colors.secondary} />
              </Pressable>
              {row.key === "account" && accountOpen ? (
                <View style={styles.account}>
                  <Text style={styles.accountLabel}>Username</Text>
                  <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Username" placeholderTextColor={colors.placeholder} style={styles.input} />
                  <PrimaryButton label={saving ? "Saving" : "Save username"} disabled={saving || deleting} onPress={() => void saveUsername()} />
                  <Pressable accessibilityRole="button" accessibilityLabel={confirmDelete ? "Delete account forever" : "Delete account"} disabled={deleting} onPress={() => void removeAccount()} style={styles.delete}>
                    <Text style={styles.deleteText}>{deleting ? "Deleting" : confirmDelete ? "Delete account forever" : "Delete account"}</Text>
                  </Pressable>
                  {confirmDelete ? <Text style={styles.warn}>This removes your profile, tasks, and friends.</Text> : null}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" },
  row: { height: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  account: { gap: 10, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  accountLabel: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 14 },
  delete: { height: 48, borderRadius: radius.input, borderWidth: 1, borderColor: colors.goalOpen, alignItems: "center", justifyContent: "center" },
  deleteText: { color: colors.goalOpen, fontSize: 14, fontWeight: "700" },
  warn: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
});
