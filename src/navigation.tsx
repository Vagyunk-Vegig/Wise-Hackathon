import { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "./components/Icons";
import { Toast } from "./components/Toast";
import { CommitmentScreen } from "./screens/CommitmentScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { DayScreen } from "./screens/DayScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SocialScreen } from "./screens/SocialScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { useStore } from "./store";
import { colors } from "./theme";
import { useRootNav, type PlanStackParamList, type RootStackParamList } from "./routes";

type TabParamList = {
  Today: undefined;
  Plan: undefined;
  Leaderboard: undefined;
  Social: undefined;
};

const Root = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.border, primary: colors.accent },
};

function PlanNavigator() {
  return (
    <PlanStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <PlanStack.Screen name="PlanHome" component={PlanScreen} />
      <PlanStack.Screen name="Day" component={DayScreen} />
    </PlanStack.Navigator>
  );
}

function AppTabs({ state, navigation }: { state: { index: number; routes: { name: string }[] }; navigation: { navigate: (name: string, params?: object) => void } }) {
  const insets = useSafeAreaInsets();
  const root = useRootNav();
  const active = state.routes[state.index]?.name;
  const items = [
    { name: "Today", label: "Today", Icon: icons.Sun },
    { name: "Plan", label: "Plan", Icon: icons.CalendarDays },
    { name: "create", label: "", Icon: icons.Plus },
    { name: "Leaderboard", label: "Leaderboard", Icon: icons.Chart },
    { name: "Social", label: "Social", Icon: icons.Users },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        if (item.name === "create") {
          return (
            <Pressable key="create" style={styles.slot} onPress={() => root.navigate("Create")}>
              <View style={styles.fab}>
                <icons.Plus size={23} color={colors.onAccent} strokeWidth={2.4} />
              </View>
            </Pressable>
          );
        }
        const on = active === item.name;
        return (
          <Pressable
            key={item.name}
            style={styles.slot}
            onPress={() => navigation.navigate(item.name, item.name === "Plan" ? { screen: "PlanHome" } : undefined)}
          >
            <item.Icon size={20} color={on ? colors.accent : colors.muted} />
            <Text style={[styles.label, on && { color: colors.accent }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabs state={props.state} navigation={props.navigation} />}>
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Plan" component={PlanNavigator} />
      <Tabs.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tabs.Screen name="Social" component={SocialScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigation() {
  const { toast, dismissToast, signedIn, authReady, onboardingComplete, onboardingReady } = useStore();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 2400);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!authReady || (signedIn && !onboardingReady)) return null;
  if (!onboardingComplete) {
    return (
      <>
        <OnboardingScreen />
        {toast ? <Toast toast={toast} /> : null}
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Root.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Root.Screen name="Main" component={MainTabs} />
        <Root.Screen name="Create" component={CreateScreen} />
        <Root.Screen name="Profile" component={ProfileScreen} />
        <Root.Screen name="Settings" component={SettingsScreen} />
        <Root.Screen name="Commitment" component={CommitmentScreen} />
        <Root.Screen name="Notifications" component={NotificationsScreen} />
      </Root.Navigator>
      {toast ? <Toast toast={toast} /> : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: colors.tab, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  slot: { flex: 1, height: 58, alignItems: "center", justifyContent: "center", gap: 5 },
  label: { color: colors.muted, fontSize: 8, fontWeight: "700" },
  fab: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
});
