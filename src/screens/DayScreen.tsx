import { ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { DayList } from "../components/DayList";
import { Screen, TopBar } from "../components/ui";
import { useRootNav, type PlanStackParamList } from "../routes";
import { useStore } from "../store";

export function DayScreen() {
  const route = useRoute<RouteProp<PlanStackParamList, "Day">>();
  const navigation = useRootNav();
  const { items, streak, completeItem } = useStore();
  const dayItems = items.filter((item) => item.date === route.params.date);

  return (
    <Screen>
      <TopBar streak={streak} onAvatar={() => navigation.navigate("Profile")} onSettings={() => navigation.navigate("Settings")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <DayList date={route.params.date} items={dayItems} onToggle={completeItem} />
      </ScrollView>
    </Screen>
  );
}
