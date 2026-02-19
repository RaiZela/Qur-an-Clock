import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { countCompletionsBetween, countCompletionsForDate, dailyCountsBetween } from "../db/db";
import { todayISO } from "../utils/dates";

function addDaysISO(dateISO: string, deltaDays: number) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthStartISO(dateISO: string) {
  const [y, m] = dateISO.split("-").map(Number);
  const yyyy = y;
  const mm = String(m).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export default function StatsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const colors = useMemo(() => {
    const bg = dark ? "#0B0F17" : "#F6F7FB";
    const card = dark ? "#121826" : "#FFFFFF";
    const text = dark ? "#EAF0FF" : "#101828";
    const muted = dark ? "rgba(234,240,255,0.65)" : "rgba(16,24,40,0.60)";
    const border = dark ? "rgba(234,240,255,0.12)" : "rgba(16,24,40,0.12)";
    const borderStrong = dark ? "rgba(234,240,255,0.22)" : "rgba(16,24,40,0.22)";
    return { bg, card, text, muted, border, borderStrong };
  }, [dark]);

  const date = todayISO();
  const monthStart = monthStartISO(date);
  const last14Start = addDaysISO(date, -13); // includes today

  const [todayDone, setTodayDone] = useState(0);
  const [monthDone, setMonthDone] = useState(0);
  const [daily, setDaily] = useState<{ date: string; c: number }[]>([]);

  const load = useCallback(() => {
    setTodayDone(countCompletionsForDate(date));
    setMonthDone(countCompletionsBetween(monthStart, date));
    setDaily(dailyCountsBetween(last14Start, date));
  }, [date, monthStart, last14Start]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Fill missing days (so you always see 14 rows)
  const dailyFilled = useMemo(() => {
    const map = new Map(daily.map((x) => [x.date, x.c]));
    const out: { date: string; c: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = addDaysISO(date, -i);
      out.push({ date: d, c: map.get(d) ?? 0 });
    }
    return out;
  }, [daily, date]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Stats</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Your habit completions
      </Text>

      {/* Summary cards */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.muted }]}>Today</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{todayDone}</Text>
          <Text style={[styles.cardHint, { color: colors.muted }]}>{date}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.muted }]}>This month</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{monthDone}</Text>
          <Text style={[styles.cardHint, { color: colors.muted }]}>
            {monthStart} → {date}
          </Text>
        </View>
      </View>

      {/* Daily list */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Last 14 days
        </Text>

        <FlatList
          data={dailyFilled}
          keyExtractor={(x) => x.date}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View
              style={[
                styles.dayRow,
                { backgroundColor: colors.card, borderColor: colors.borderStrong },
              ]}
            >
              <Text style={[styles.dayDate, { color: colors.text }]}>{item.date}</Text>
              <View style={[styles.countPill, { borderColor: colors.borderStrong }]}>
                <Text style={[styles.countText, { color: colors.text }]}>{item.c}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  title: { fontSize: 30, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 13 },

  cardsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardLabel: { fontSize: 13, fontWeight: "800" },
  cardValue: { marginTop: 8, fontSize: 40, fontWeight: "900" },
  cardHint: { marginTop: 6, fontSize: 12 },

  section: {
    marginTop: 14,
    borderTopWidth: 1,
    paddingTop: 14,
    flex: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 10 },

  dayRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayDate: { fontSize: 14, fontWeight: "800" },

  countPill: {
    minWidth: 44,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  countText: { fontSize: 14, fontWeight: "900" },
});