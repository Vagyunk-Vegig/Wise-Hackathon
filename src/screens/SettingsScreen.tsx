import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { PageHeader, Screen } from "../components/ui";
import { colors } from "../theme";
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
  const { showToast, signOut, currentUser } = useStore();

  return (
    <Screen>
      <View style={styles.body}>
        <PageHeader title="Settings" onBack={() => navigation.goBack()} />
        <View style={styles.card}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              onPress={() => {
                if (row.key === "commitment") navigation.navigate("Commitment");
                else if (row.key === "notes") navigation.navigate("Notifications");
                else if (row.key === "logout") {
                  void signOut().catch((error: unknown) => {
                    showToast(error instanceof Error ? error.message : "Could not sign out", "error", "alert");
                  });
                } else if (row.key === "account") showToast(currentUser ? `Signed in as ${currentUser.username}` : "Not signed in");
                else showToast(`${row.label} stays on this device.`);
              }}
              style={[styles.row, index < rows.length - 1 && styles.divider]}
            >
              <row.Icon size={18} color={colors.text} />
              <Text style={styles.label}>{row.label}</Text>
              <icons.ChevronRight size={16} color={colors.secondary} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" },
  row: { height: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
});
