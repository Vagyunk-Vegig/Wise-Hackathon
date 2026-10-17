import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import { icons } from "../components/Icons";
import { AvatarMark, Screen, SectionLabel, TopBar } from "../components/ui";
import { toPerson } from "../db";
import { searchByUsername } from "../search";
import { colors } from "../theme";
import { useRootNav } from "../routes";
import { useStore } from "../store";
import type { Person } from "../types";

export function SocialScreen() {
  const root = useRootNav();
  const { requests, friends, outgoing, users, currentUser, streak, dailyTasks, pokeNotice, dismissPokeNotice, acceptRequest, sendRequest, poke, refreshBoard, showToast } = useStore();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const refreshingRef = useRef(false);
  const refresh = async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await refreshBoard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not refresh", "error", "alert");
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  };
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = scrollRef.current?.getScrollableNode() as unknown as HTMLElement | undefined;
    if (!node) return;
    let start = 0;
    let tracking = false;
    let wheel = 0;
    let wheelTimer = 0;
    const begin = (y: number) => {
      if (node.scrollTop > 2) return;
      start = y;
      tracking = true;
    };
    const finish = (y: number) => {
      if (!tracking) return;
      tracking = false;
      if (node.scrollTop <= 2 && y - start > 72) void refreshRef.current();
    };
    const onTouchStart = (event: TouchEvent) => begin(event.touches[0]?.clientY ?? 0);
    const onTouchEnd = (event: TouchEvent) => finish(event.changedTouches[0]?.clientY ?? 0);
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") begin(event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") finish(event.clientY);
    };
    const onWheel = (event: WheelEvent) => {
      if (node.scrollTop > 2 || event.deltaY >= 0) {
        wheel = 0;
        return;
      }
      wheel += -event.deltaY;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheel = 0;
      }, 180);
      if (wheel > 80) {
        wheel = 0;
        void refreshRef.current();
      }
    };
    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
    };
  }, []);
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
      <TopBar streak={streak} onAvatar={() => root.navigate("Profile")} onSettings={() => root.navigate("Settings")} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <View>
          <Text style={styles.title}>Social</Text>
          <Text style={styles.sub}>Friends and pokes</Text>
        </View>
        {pokeNotice ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss poke reward" onPress={dismissPokeNotice} style={styles.notice}>
            <icons.Bell size={16} color={colors.accent} />
            <Text style={styles.noticeText}>{pokeNotice}</Text>
          </Pressable>
        ) : null}
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search by username"
            placeholderTextColor={colors.muted}
            style={[styles.input, Platform.OS === "web" ? { outlineWidth: 0 } : null]}
          />
          <View pointerEvents="none" style={styles.searchIcon}>
            <icons.Search size={17} color={colors.muted} />
          </View>
        </View>
        {refreshing ? <Text style={styles.meta}>Refreshing…</Text> : null}
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
          {friends.map((person) => {
            const tasks = dailyTasks[person.id] ?? { done: 0, total: 0 };
            return (
              <PersonRow
                key={person.id}
                person={{ ...person, meta: tasks.total === 0 ? "No tasks today" : `${tasks.done}/${tasks.total}` }}
                action={person.poke === "sent" ? "Sent" : "Poke"}
                disabled={person.poke !== "poke"}
                onPress={() => poke(person.id)}
              />
            );
          })}
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
        <AvatarMark icon={person.icon} initials={person.initials} size={36} textColor={person.color} background={colors.elevated} />
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
  scroll: { flex: 1 },
  body: { padding: 16, paddingTop: 24, gap: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  sub: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  notice: { borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  noticeText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "700" },
  search: { height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center", overflow: "hidden" },
  searchIcon: { position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center" },
  input: { height: "100%", width: "100%", margin: 0, paddingVertical: 0, paddingLeft: 40, paddingRight: 14, color: colors.text, fontSize: 14, backgroundColor: "transparent", borderWidth: 0 },
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
