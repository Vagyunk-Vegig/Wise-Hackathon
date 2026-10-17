import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons, profileIconNames, profileIcons } from "../components/Icons";
import { AvatarMark, IconButton, PageHeader, Screen } from "../components/ui";
import { colors } from "../theme";
import { XP_PER_LEVEL } from "../sample";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

const heat = [colors.heat4, colors.heat3, colors.heat2, colors.heat1];
const rows = [
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 3],
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 3, 3, 3],
];

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Profile">>();
  const { currentUser, users, items, completedCounts, setProfileIcon } = useStore();
  const requestedId = route.params?.userId;
  const viewingSelf = !requestedId || requestedId === currentUser?.id;
  const profile = viewingSelf ? currentUser : users.find((user) => user.id === requestedId) ?? null;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  const completed = viewingSelf
    ? items.reduce((count, item) => count + (item.kind === "habit" ? item.doneDates.length : item.done ? 1 : 0), 0)
    : completedCounts[profile?.id ?? ""] ?? 0;
  const name = profile?.username ?? "No profile";
  const badgeList = (profile?.badges ?? []).map((label) => ({ label, color: colors.accent, Icon: icons.Star }));
  const activity = completed > 0 ? rows : rows.map((row) => row.map(() => 3));
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <PageHeader
          title="Profile"
          onBack={() => navigation.goBack()}
          right={
            viewingSelf ? (
              <IconButton onPress={() => navigation.navigate("Settings")}>
                <icons.Settings size={18} color={colors.text} />
              </IconButton>
            ) : undefined
          }
        />
        <View style={styles.identity}>
          <AvatarMark icon={profile?.icon ?? null} initials={profile?.initials ?? "··"} size={78} textColor={profile ? colors.onAccent : colors.text} background={profile ? colors.accent : colors.surface} />
          <Text style={styles.name}>{name}</Text>
          {viewingSelf && profile ? (
            <View style={styles.iconRow}>
              {profileIconNames.map((iconName) => {
                const Icon = profileIcons[iconName];
                const selected = profile.icon === iconName;
                return (
                  <Pressable key={iconName} accessibilityRole="button" accessibilityLabel={`${iconName} icon`} onPress={() => void setProfileIcon(selected ? null : iconName)} style={[styles.iconChoice, selected && styles.iconChoiceOn]}>
                    <Icon size={18} color={selected ? colors.onAccent : colors.text} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {profile ? null : <Text style={styles.age}>{viewingSelf ? "Sign in to save a profile." : "This profile is unavailable."}</Text>}
        </View>
        <View style={{ gap: 10, alignItems: "center" }}>
          <Text style={styles.level}>Level {level}</Text>
          <View style={styles.pill}>
            <View style={[styles.pillFill, { width: `${Math.max(22, Math.round((into / XP_PER_LEVEL) * 100))}%` }]}>
              <Text style={styles.pillText}>{into}/{XP_PER_LEVEL}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <icons.Flame size={17} color={colors.streak} fill={colors.streak} />
              <Text style={styles.statText}>{streak} day streak</Text>
            </View>
            <View style={styles.stat}>
              <icons.CircleCheck size={17} color={colors.accent} />
              <Text style={styles.statText}>{completed} completed</Text>
            </View>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={styles.block}>Activity</Text>
          <View style={styles.heatCard}>
            {activity.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.heatRow}>
                {row.map((level, cell) => (
                  <View key={cell} style={[styles.cell, { backgroundColor: heat[level] }]} />
                ))}
              </View>
            ))}
          </View>
        </View>
        <View style={{ gap: 14 }}>
          <Text style={styles.block}>Achievements</Text>
          {badgeList.length === 0 ? (
            <Text style={styles.age}>No achievements yet. Complete a task to start one.</Text>
          ) : (
            <View style={styles.badges}>
              {badgeList.map((badge) => (
                <View key={badge.label} style={styles.badge}>
                  <View style={[styles.ring, { borderColor: badge.color }]}>
                    <badge.Icon size={19} color={badge.color} />
                  </View>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 20 },
  identity: { alignItems: "center", gap: 8 },
  iconRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 },
  iconChoice: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  iconChoiceOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  portrait: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center" },
  initials: { color: colors.onAccent, fontSize: 26, fontWeight: "800" },
  name: { color: colors.text, fontSize: 26, fontWeight: "700" },
  age: { color: colors.secondary, fontSize: 12 },
  level: { color: colors.text, fontSize: 14, fontWeight: "700" },
  pill: { height: 28, width: "100%", borderRadius: 999, backgroundColor: colors.pillTrack, overflow: "hidden" },
  pillFill: { height: 28, width: "69%", borderRadius: 999, backgroundColor: colors.accent, alignItems: "flex-end", justifyContent: "center", paddingRight: 12 },
  pillText: { color: colors.onAccent, fontSize: 12, fontWeight: "800" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  statText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  block: { color: colors.text, fontSize: 17, fontWeight: "700" },
  heatCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: "center", gap: 3 },
  heatRow: { flexDirection: "row", gap: 3 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  badges: { flexDirection: "row", gap: 6 },
  badge: { flex: 1, alignItems: "center", gap: 8 },
  ring: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badgeLabel: { color: colors.secondary, fontSize: 8, textAlign: "center", lineHeight: 11 },
});
