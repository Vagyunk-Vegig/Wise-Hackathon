import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { icons } from "../components/Icons";
import { Screen, SectionLabel, TopBar } from "../components/ui";
import { toPerson } from "../db";
import { searchByUsername } from "../search";
import { colors } from "../theme";
import { useRootNav } from "../routes";
import { useStore } from "../store";
import type { Person } from "../types";

export function SocialScreen() {
  const root = useRootNav();
  const { requests, friends, outgoing, users, currentUser, streak, totalXp, acceptRequest, sendRequest, poke } = useStore();
  const progress = (totalXp % 500) / 500;
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchByUsername(users, query, currentUser?.id).map(toPerson), [users, query, currentUser?.id]);
  const searching = query.trim().length > 0;

  const searchAction = (id: string) => {
    if (friends.some((person) => person.id === id)) return { action: "Friends", disabled: true, onPress: undefined };
    if (requests.some((person) => person.id === id)) return { action: "Accept", disabled: false, onPress: () => acceptRequest(id) };
    if (outgoing.includes(id)) return { action: "Sent", disabled: true, onPress: undefined };
    return { action: "Add", disabled: false, onPress: () => void sendRequest(id) };
  };

  return (
    <Screen>
      <TopBar progress={progress} streak={streak} onAvatar={() => root.navigate("Profile")} onSettings={() => root.navigate("Settings")} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Social</Text>
          <Text style={styles.sub}>Friends and pokes</Text>
        </View>
        <View style={styles.search}>
          <icons.Search size={17} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search by username"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
        {searching ? (
          <View style={{ gap: 8 }}>
            <SectionLabel title="PEOPLE" />
            {matches.length === 0 ? <Text style={styles.meta}>No users match that name.</Text> : null}
            {matches.map((person) => {
              const action = searchAction(person.id);
              return <PersonRow key={person.id} person={person} action={action.action} disabled={action.disabled} onPress={action.onPress} />;
            })}
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <SectionLabel title="REQUESTS" />
          {requests.length === 0 ? <Text style={styles.meta}>No friend requests.</Text> : null}
          {requests.map((person) => (
            <PersonRow key={person.id} person={person} action="Accept" onPress={() => acceptRequest(person.id)} />
          ))}
        </View>
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

function PersonRow({ person, action, disabled, onPress }: { person: Person; action?: string; disabled?: boolean; onPress?: () => void }) {
  const root = useRootNav();
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${person.name} profile`} onPress={() => root.navigate("Profile", { userId: person.id })} style={styles.person}>
        <View style={styles.avatar}>
          <Text style={[styles.initials, { color: person.color }]}>{person.initials}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.meta}>{person.meta}</Text>
        </View>
      </Pressable>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} disabled={disabled} style={[styles.pill, disabled && styles.pillOff]}>
          <Text style={[styles.pillText, disabled && { color: colors.placeholder }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 24, gap: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  sub: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  search: { height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontSize: 13 },
  row: { height: 72, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  person: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 12, fontWeight: "800" },
  name: { color: colors.text, fontSize: 14, fontWeight: "700" },
  meta: { color: colors.secondary, fontSize: 11 },
  pill: { minWidth: 68, height: 32, borderRadius: 999, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  pillOff: { backgroundColor: colors.elevated },
  pillText: { color: colors.onAccent, fontSize: 12, fontWeight: "700" },
  note: { flexDirection: "row", gap: 8 },
  noteText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 18 },
});
