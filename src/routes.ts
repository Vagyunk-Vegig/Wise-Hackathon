import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ItemKind } from "./types";

export type RootStackParamList = {
  Main: undefined;
  Create: { date?: string; kind?: ItemKind } | undefined;
  Profile: { userId?: string } | undefined;
  Settings: undefined;
  Commitment: undefined;
  Notifications: undefined;
};

export type PlanStackParamList = {
  PlanHome: undefined;
  Day: { date: string };
};

export function useRootNav() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  let current = navigation;
  let parent = current.getParent?.();
  while (parent) {
    current = parent as NativeStackNavigationProp<RootStackParamList>;
    parent = current.getParent?.();
  }
  return current;
}
