import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { DayList } from "../components/DayList";
import { Screen, TopBar } from "../components/ui";
import { itemsForDate } from "../schedule";
import { colors } from "../theme";
import { useRootNav, type PlanStackParamList } from "../routes";
import { useStore } from "../store";

export function DayScreen() {
  const route = useRoute<RouteProp<PlanStackParamList, "Day">>();
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const root = useRootNav();
  const { items, streak, completeItem } = useStore();
  const dayItems = itemsForDate(items, route.params.date);

  return (
    <Screen>
      <TopBar streak={streak} onAvatar={() => root.navigate("Profile")} onSettings={() => root.navigate("Settings")} />
      <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
        <icons.ChevronLeft size={18} color={colors.text} />
        <Text style={styles.backText}>Plan</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <DayList date={route.params.date} items={dayItems} onToggle={(id) => completeItem(id, route.params.date)} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 12, marginTop: 8, alignSelf: "flex-start", height: 36 },
  backText: { color: colors.text, fontSize: 14, fontWeight: "700" },
});
