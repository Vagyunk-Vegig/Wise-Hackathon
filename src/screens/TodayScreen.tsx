import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DayList } from "../components/DayList";
import { icons } from "../components/Icons";
import { PrimaryButton, Screen, TopBar } from "../components/ui";
import { TODAY } from "../dates";
import { itemsForDate } from "../schedule";
import { colors } from "../theme";
import { useRootNav } from "../routes";
import { useStore } from "../store";

export function TodayScreen() {
  const navigation = useRootNav();
  const { items, streak, completeItem } = useStore();
  const today = itemsForDate(items, TODAY);

  return (
    <Screen>
      <TopBar streak={streak} onAvatar={() => navigation.navigate("Profile")} onSettings={() => navigation.navigate("Settings")} />
      <ScrollView contentContainerStyle={today.length === 0 ? { flexGrow: 1 } : { paddingHorizontal: 16, paddingBottom: 24 }}>
        {today.length === 0 ? (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <DayList
              date={TODAY}
              items={[]}
              empty={
                <View style={styles.emptyWrap}>
                  <View style={styles.empty}>
                    <View style={styles.ring}>
                      <icons.Plus size={24} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>Nothing due today</Text>
                    <Text style={styles.emptyBody}>Add a habit or a task. A streak starts when you complete one.</Text>
                  </View>
                  <PrimaryButton label="+ Add task" onPress={() => navigation.navigate("Create", { date: TODAY, kind: "goal" })} />
                </View>
              }
            />
          </View>
        ) : (
          <DayList date={TODAY} items={today} onToggle={(id) => completeItem(id, TODAY)} />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, justifyContent: "space-between", paddingBottom: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  ring: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderStyle: "dashed", borderColor: colors.euro, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptyBody: { color: colors.secondary, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
