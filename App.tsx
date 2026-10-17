import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.word}>habit.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090E10",
    alignItems: "center",
    justifyContent: "center",
  },
  word: {
    color: "#F3F7F8",
    fontSize: 32,
    fontWeight: "700",
  },
});
