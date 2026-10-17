import { StatusBar } from "expo-status-bar";
import { Dimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigation } from "./src/navigation";
import { StoreProvider } from "./src/store";
import { colors } from "./src/theme";

export default function App() {
  const frameWidth = Math.min(Dimensions.get("window").width, 430);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#050807", alignItems: "center" }}>
      <SafeAreaProvider style={{ flex: 1, width: frameWidth, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, width: frameWidth, backgroundColor: colors.bg }}>
          <StoreProvider>
            <StatusBar style="light" />
            <AppNavigation />
          </StoreProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
