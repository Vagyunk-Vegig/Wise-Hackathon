import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { icons } from "../components/Icons";
import { Screen, SecondaryButton, TopBar } from "../components/ui";
import { colors } from "../theme";
import { useRootNav } from "../routes";
import { useStore } from "../store";

export function LeaderboardScreen() {
  const navigation = useNavigation();
  const root = useRootNav();
  const { streak, users, currentUser } = useStore();
  const rows = [...users]
    .sort((a, b) => b.streak - a.streak || b.xp - a.xp)
    .map((user, index) => ({
      rank: index + 1,
      name: user.id === currentUser?.id ? "You" : user.username,
      initials: user.initials,
      color: user.color,
      streak: user.streak,
      you: user.id === currentUser?.id,
    }));

  return (
    <Screen>
      <TopBar streak={streak} onAvatar={() => root?.navigate("Profile")} onSettings={() => root?.navigate("Settings")} />
      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>This week</Text>
        </View>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <icons.Users size={24} color={colors.accent} />
            <Text style={styles.emptyTitle}>Start your streak together.</Text>
            <Text style={styles.emptyBody}>Connect with friends to see your weekly ranking.</Text>
            <SecondaryButton label="Go to Social" onPress={() => navigation.navigate("Social" as never)} />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {rows.map((row) => (
              <View key={row.rank} style={[styles.row, row.you && styles.you]}>
                <Text style={[styles.rank, row.rank === 1 && { color: colors.accent }]}>{row.rank}</Text>
                <View style={[styles.avatar, row.you && styles.youAvatar]}>
                  <View style={[styles.avatarInset, row.you && { backgroundColor: colors.onAccent }]}>
                    <Text style={[styles.initials, { color: row.color }]}>{row.initials}</Text>
                  </View>
                </View>
                <Text style={styles.name}>{row.name}</Text>
                <icons.Flame size={16} color={colors.streak} fill={colors.streak} />
                <Text style={styles.streak}>{row.streak}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.note}>
          <icons.LockKeyhole size={13} color={colors.muted} />
          <Text style={styles.noteText}>Ranked by current streak. Task titles stay private.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 24, gap: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  sub: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  row: { height: 64, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 12 },
  you: { backgroundColor: "rgba(182,255,112,0.04)", borderColor: "rgba(182,255,112,0.31)" },
  rank: { width: 14, color: colors.secondary, fontSize: 14, fontWeight: "700" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  youAvatar: { backgroundColor: colors.accent },
  avatarInset: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 12, fontWeight: "800" },
  name: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  streak: { color: colors.streak, fontSize: 19, fontWeight: "800" },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  noteText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 18 },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" },
  emptyBody: { color: colors.secondary, fontSize: 11, lineHeight: 18, textAlign: "center" },
});
