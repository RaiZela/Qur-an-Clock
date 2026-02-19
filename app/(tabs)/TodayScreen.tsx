import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { listHabitsWithToday, toggleCompletion } from "../db/db";
import { HabitWithToday } from "../types";
import { todayISO } from "../utils/dates";

export default function TodayScreen() {
  const [items, setItems] = useState<HabitWithToday[]>([]);
  const date = todayISO();

  // ✅ Dark mode from system
  const isDark = false; // <- will be overwritten below
  // NOTE: useColorScheme is from react-native
  // keeping it inline to avoid extra imports in your paste? Nope—import it properly:
  // (see import list below)
  // We'll compute colors using the actual scheme:
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scheme = require("react-native").useColorScheme?.() ?? "light";
  const dark = scheme === "dark";

  const colors = useMemo(() => {
    const bg = dark ? "#0B0F17" : "#F6F7FB";
    const card = dark ? "#121826" : "#FFFFFF";
    const text = dark ? "#EAF0FF" : "#101828";
    const muted = dark ? "rgba(234,240,255,0.65)" : "rgba(16,24,40,0.60)";
    const border = dark ? "rgba(234,240,255,0.12)" : "rgba(16,24,40,0.12)";
    const borderStrong = dark ? "rgba(234,240,255,0.22)" : "rgba(16,24,40,0.22)";
    const successBg = dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.10)";
    const successBorder = dark ? "rgba(34,197,94,0.35)" : "rgba(34,197,94,0.30)";
    return { bg, card, text, muted, border, borderStrong, successBg, successBorder };
  }, [dark]);

  const load = useCallback(() => {
    setItems(listHabitsWithToday(date));
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const doneCount = useMemo(() => items.filter((x) => x.doneToday).length, [items]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Today</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{date}</Text>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {doneCount}/{items.length} completed
          </Text>
          <Text style={[styles.summaryHint, { color: colors.muted }]}>
            Tap a habit to mark it done
          </Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const done = item.doneToday;

          return (
            <Pressable
              onPress={() => {
                toggleCompletion(item.id, date);
                load();
              }}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: done ? colors.successBorder : colors.border,
                },
                done ? { backgroundColor: colors.successBg } : null,
              ]}
            >
              <View style={styles.left}>
                <Text style={styles.emoji}>{item.emoji ?? "•"}</Text>
                <View>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.muted }]}>
                    {done ? "Completed" : "Not done yet"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.pill,
                  {
                    borderColor: done ? colors.successBorder : colors.borderStrong,
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: colors.text }]}>
                  {done ? "✅" : "○"}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  header: { marginBottom: 14 },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 14 },

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  summaryText: { fontSize: 16, fontWeight: "800" },
  summaryHint: { marginTop: 6, fontSize: 13 },

  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: { flexDirection: "row", gap: 12, alignItems: "center" },
  emoji: { fontSize: 20, width: 26, textAlign: "center" },

  cardText: { fontSize: 17, fontWeight: "800" },
  cardMeta: { marginTop: 4, fontSize: 13 },

  pill: {
    width: 44,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 18, fontWeight: "900" },
});