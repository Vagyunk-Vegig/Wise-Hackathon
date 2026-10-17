import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { IconButton, PageHeader, Screen } from "../components/ui";
import { colors } from "../theme";
import type { RootStackParamList } from "../routes";

const heat = [colors.heat4, colors.heat3, colors.heat2, colors.heat1];
const rows = [
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 3],
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 3, 3, 3],
];

const badges = [
  { label: "7 Day Streak", color: colors.accent, Icon: icons.Star },
  { label: "Level 10", color: colors.accent, Icon: icons.Leaf },
  { label: "50 Tasks", color: colors.streak, Icon: icons.CircleCheck },
  { label: "Early Bird", color: colors.study, Icon: icons.Sunrise },
  { label: "Longest streak", color: colors.achievement, Icon: icons.Flame },
];

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <PageHeader
          title="Profile"
          onBack={() => navigation.goBack()}
          right={
            <IconButton onPress={() => navigation.navigate("Settings")}>
              <icons.Settings size={18} color={colors.text} />
            </IconButton>
          }
        />
        <View style={styles.identity}>
          <Image source={require("../../assets/alex.png")} style={styles.portrait} />
          <Text style={styles.name}>Alex</Text>
          <Text style={styles.age}>21 years old</Text>
        </View>
        <View style={{ gap: 10, alignItems: "center" }}>
          <Text style={styles.level}>Level 12</Text>
          <View style={styles.pill}>
            <View style={styles.pillFill}>
              <Text style={styles.pillText}>1250/1800</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <icons.Flame size={17} color={colors.streak} fill={colors.streak} />
              <Text style={styles.statText}>24 day streak</Text>
            </View>
            <View style={styles.stat}>
              <icons.CircleCheck size={17} color={colors.accent} />
              <Text style={styles.statText}>142 completed</Text>
            </View>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={styles.block}>Activity</Text>
          <View style={styles.heatCard}>
            {rows.map((row, rowIndex) => (
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
          <View style={styles.badges}>
            {badges.map((badge) => (
              <View key={badge.label} style={styles.badge}>
                <View style={[styles.ring, { borderColor: badge.color }]}>
                  <badge.Icon size={19} color={badge.color} />
                </View>
                <Text style={styles.badgeLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 20 },
  identity: { alignItems: "center", gap: 8 },
  portrait: { width: 78, height: 78, borderRadius: 39 },
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
