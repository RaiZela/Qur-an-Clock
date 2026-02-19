import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { createHabit, deleteHabit, listHabits, updateHabit } from "../db/db";
import { Habit } from "../types";

export default function HabitsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const colors = useMemo(() => {
    const bg = dark ? "#0B0F17" : "#F6F7FB";
    const card = dark ? "#121826" : "#FFFFFF";
    const text = dark ? "#EAF0FF" : "#101828";
    const muted = dark ? "rgba(234,240,255,0.65)" : "rgba(16,24,40,0.60)";
    const border = dark ? "rgba(234,240,255,0.12)" : "rgba(16,24,40,0.12)";
    const borderStrong = dark ? "rgba(234,240,255,0.22)" : "rgba(16,24,40,0.22)";
    const dangerBg = dark ? "rgba(239,68,68,0.16)" : "rgba(239,68,68,0.12)";
    const dangerBorder = dark ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.30)";
    const warnBg = dark ? "rgba(245,158,11,0.16)" : "rgba(245,158,11,0.12)";
    const warnBorder = dark ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.30)";
    return { bg, card, text, muted, border, borderStrong, dangerBg, dangerBorder, warnBg, warnBorder };
  }, [dark]);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  const openSwipeRef = useRef<Swipeable | null>(null);

  const load = useCallback(() => {
    setHabits(listHabits());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function closeOpenSwipe() {
    openSwipeRef.current?.close();
    openSwipeRef.current = null;
  }

  function startEdit(h: Habit) {
    closeOpenSwipe();
    setEditId(h.id);
    setEditName(h.name);
    setEditEmoji(h.emoji ?? "");
    setEditOpen(true);
  }

  function doDelete(h: Habit) {
    closeOpenSwipe();
    deleteHabit(h.id);
    load();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Habits</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Swipe a habit for Edit / Delete
      </Text>

      {/* Add row */}
      <View style={styles.row}>
        <TextInput
          value={emoji}
          onChangeText={setEmoji}
          placeholder="Emoji"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { width: 90, color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card },
          ]}
          maxLength={2}
        />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Habit name (e.g. Tahajjud)"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { flex: 1, color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card },
          ]}
        />
        <Pressable
          style={[styles.button, { borderColor: colors.borderStrong, backgroundColor: colors.card }]}
          onPress={() => {
            createHabit(name, emoji || null);
            setName("");
            setEmoji("");
            load();
          }}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Swipeable
            overshootRight={false}
            onSwipeableWillOpen={(dir) => {
              // Only keep one row open at a time
              if (openSwipeRef.current) openSwipeRef.current.close();
            }}
            ref={(ref) => {
              // Keep latest opened swipeable in a ref when it opens (below)
            }}
            onSwipeableOpen={() => {
              // capture the currently opened swipe row
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              openSwipeRef.current = (openSwipeRef.current as any) ?? null;
            }}
            renderRightActions={() => (
              <View style={styles.actionsWrap}>
                <Pressable
                  onPress={() => startEdit(item)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.warnBg, borderColor: colors.warnBorder },
                  ]}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => doDelete(item)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
                  ]}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          >
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.left}>
                <Text style={styles.emojiBig}>{item.emoji ?? "•"}</Text>
                <View>
                  <Text style={[styles.cardText, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>{item.schedule_type}</Text>
                </View>
              </View>
            </View>
          </Swipeable>
        )}
      />

      {/* Edit modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit habit</Text>

            <View style={styles.modalRow}>
              <TextInput
                value={editEmoji}
                onChangeText={setEditEmoji}
                placeholder="Emoji"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  { width: 90, color: colors.text, borderColor: colors.borderStrong, backgroundColor: "transparent" },
                ]}
                maxLength={2}
              />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  { flex: 1, color: colors.text, borderColor: colors.borderStrong, backgroundColor: "transparent" },
                ]}
              />
            </View>

            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setEditOpen(false)}
                style={[styles.modalBtn, { borderColor: colors.borderStrong }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (editId == null) return;
                  updateHabit(editId, editName, editEmoji || null);
                  setEditOpen(false);
                  load();
                }}
                style={[styles.modalBtn, { borderColor: colors.borderStrong }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 30, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 13 },

  row: { flexDirection: "row", gap: 10, marginTop: 14, alignItems: "center" },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    fontWeight: "600",
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonText: { fontWeight: "900" },

  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  emojiBig: { fontSize: 22, width: 28, textAlign: "center" },
  cardText: { fontSize: 16, fontWeight: "900" },
  meta: { marginTop: 6, fontSize: 13 },

  actionsWrap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingRight: 6,
  },
  actionBtn: {
    height: "100%",
    minWidth: 86,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalBtnText: { fontWeight: "900" },
});