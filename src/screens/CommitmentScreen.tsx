import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { PageHeader, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { colors } from "../theme";
import { useStore } from "../store";
import type { RootStackParamList } from "../routes";

const rules = [
  ["Amount", "2.00 EUR / missed task"],
  ["Destination", "Charity · saved"],
  ["Eligible", "Work tasks"],
  ["Cutoff", "23:59 · Budapest"],
];

export function CommitmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { commitmentOn, setCommitment, showToast } = useStore();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={{ gap: 20 }}>
          <PageHeader title="Commitment" onBack={() => navigation.goBack()} />
          <View style={styles.banner}>
            <icons.ShieldAlert size={19} color={colors.streak} />
            <Text style={styles.bannerText}>
              {commitmentOn ? "Calculation is on. No money moves in this build." : "Off until you review and confirm. No money moves in this build."}
            </Text>
          </View>
          <View>
            {rules.map(([label, value]) => (
              <View key={label} style={styles.rule}>
                <Text style={styles.ruleLabel}>{label}</Text>
                <Text style={styles.ruleValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>At risk tonight</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>2.00 EUR</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>Finish project report is still open</Text>
          </View>
          {["Charged per missed task, not a flat fee.", "You can pause before the cutoff.", "A transfer is never shown as paid early."].map((line) => (
            <Text key={line} style={styles.bullet}>{`•  ${line}`}</Text>
          ))}
          <View style={styles.lock}>
            <icons.LockKeyhole size={15} color={colors.placeholder} />
            <Text style={styles.lockText}>Money transfer · unavailable</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <PrimaryButton
            label="Enable calculation"
            onPress={() => {
              setCommitment(true);
              showToast("Calculation on. No money moves in this build.");
            }}
          />
          <SecondaryButton
            label="Keep off"
            onPress={() => {
              setCommitment(false);
              navigation.goBack();
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: "space-between", padding: 16, paddingBottom: 28, gap: 24 },
  banner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,159,67,0.09)", borderWidth: 1, borderColor: "rgba(255,159,67,0.25)" },
  bannerText: { flex: 1, color: colors.streak, fontSize: 12, lineHeight: 19 },
  rule: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  ruleLabel: { color: colors.secondary, fontSize: 12 },
  ruleValue: { color: colors.text, fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  chip: { backgroundColor: "rgba(255,159,67,0.09)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { color: colors.streak, fontSize: 11, fontWeight: "700" },
  cardMeta: { color: colors.secondary, fontSize: 11 },
  bullet: { color: colors.secondary, fontSize: 11, lineHeight: 16 },
  lock: { height: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  lockText: { color: colors.placeholder, fontSize: 12 },
});
