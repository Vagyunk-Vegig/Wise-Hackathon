import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { icons } from "../components/Icons";
import { Screen, SectionLabel } from "../components/ui";
import { colors } from "../theme";
import { useStore } from "../store";
import type { Person } from "../types";

export function SocialScreen() {
  const { requests, friends, acceptRequest, poke } = useStore();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <Text style={styles.title}>Social</Text>
          <Text style={styles.sub}>Friends and pokes</Text>
        </View>
        <View style={styles.search}>
          <icons.Search size={17} color={colors.muted} />
          <TextInput placeholder="Username or invite link" placeholderTextColor={colors.muted} style={styles.input} />
        </View>
        {requests.length > 0 ? (
          <View style={{ gap: 8 }}>
            <SectionLabel title="REQUESTS" />
            {requests.map((person) => (
              <PersonRow key={person.id} person={person} action="Accept" onPress={() => acceptRequest(person.id)} />
            ))}
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <SectionLabel title="FRIENDS" />
          {friends.length === 0 ? <Text style={styles.meta}>No friends yet.</Text> : null}
          {friends.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              action={person.poke === "sent" ? "Sent" : "Poke"}
              disabled={person.poke !== "poke"}
              onPress={() => poke(person.id)}
            />
          ))}
        </View>
        <View style={styles.note}>
          <icons.LockKeyhole size={13} color={colors.muted} />
          <Text style={styles.noteText}>Friends see progress, not task names.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PersonRow({ person, action, disabled, onPress }: { person: Person; action: string; disabled?: boolean; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={[styles.initials, { color: person.color }]}>{person.initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.meta}>{person.meta}</Text>
      </View>
      <Pressable onPress={onPress} disabled={disabled} style={[styles.pill, disabled && styles.pillOff]}>
        <Text style={[styles.pillText, disabled && { color: colors.placeholder }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 16, gap: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  sub: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  search: { height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontSize: 13 },
  row: { height: 72, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 12, fontWeight: "800" },
  name: { color: colors.text, fontSize: 14, fontWeight: "700" },
  meta: { color: colors.secondary, fontSize: 11 },
  pill: { width: 68, height: 32, borderRadius: 999, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  pillOff: { backgroundColor: colors.elevated },
  pillText: { color: colors.onAccent, fontSize: 12, fontWeight: "700" },
  note: { flexDirection: "row", gap: 8 },
  noteText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 18 },
});
