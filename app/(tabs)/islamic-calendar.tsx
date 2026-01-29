import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HijriInfo = {
  hijriLabel: string;
  gregorianLabel: string;
};

type Milestone = { title: string; dateLabel: string; inDays: number };

const MILESTONES = [
  { title: "Ramadan begins", hijriMonth: 9, hijriDay: 1 },
  { title: "Dhul Hijjah begins", hijriMonth: 12, hijriDay: 1 },
  { title: "Day of Arafah", hijriMonth: 12, hijriDay: 9 },
  { title: "Eid al-Adha", hijriMonth: 12, hijriDay: 10 },
  { title: "Islamic New Year", hijriMonth: 1, hijriDay: 1 },
];

function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function fetchHijriForToday(): Promise<HijriInfo> {
  const today = new Date();
  const dateStr = formatDDMMYYYY(today);

  const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${dateStr}`);
  const json = await res.json();

  const hijri = json.data.hijri;
  const greg = json.data.gregorian;

  return {
    hijriLabel: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
    gregorianLabel: `${greg.day} ${greg.month.en} ${greg.year}`,
  };
}

function moonPhaseIndex(date = new Date()) {
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
  const synodicMonth = 29.530588853;

  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = (daysSince % synodicMonth) / synodicMonth;
  return Math.floor(phase * 8) % 8;
}

function moonEmoji(idx: number) {
  const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return phases[idx] ?? "🌙";
}

async function fetchGtoHCalendar(month: number, year: number) {
  const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
  const json = await res.json();
  return json.data as any[];
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function findUpcomingMilestones(): Promise<Milestone[]> {
  const today = new Date();
  const results: Milestone[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const cal = await fetchGtoHCalendar(d.getMonth() + 1, d.getFullYear());

    for (const entry of cal) {
      const hijri = entry.hijri;
      const greg = entry.gregorian;

      const gDate = new Date(
        Number(greg.year),
        Number(greg.month.number) - 1,
        Number(greg.day)
      );

      if (gDate < today) continue;

      for (const m of MILESTONES) {
        if (Number(hijri.month.number) === m.hijriMonth && Number(hijri.day) === m.hijriDay) {
          results.push({
            title: m.title,
            dateLabel: `${greg.date} • ${hijri.day} ${hijri.month.en} ${hijri.year}`,
            inDays: daysBetween(today, gDate),
          });
        }
      }
    }

    if (results.length >= 3) break;
  }

  results.sort((a, b) => a.inDays - b.inDays);
  return results.slice(0, 3);
}

export default function IslamicCalendarCard() {
  const [loading, setLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState<HijriInfo | null>(null);
  const [moon, setMoon] = useState("🌙");
  const [upcoming, setUpcoming] = useState<Milestone[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const info = await fetchHijriForToday();
        const moonIcon = moonEmoji(moonPhaseIndex(new Date()));
        const upcomingList = await findUpcomingMilestones();

        if (!alive) return;

        setDateInfo(info);
        setMoon(moonIcon);
        setUpcoming(upcomingList);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load calendar");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
      <LinearGradient
        colors={["#f7f7fb", "#e9ecf3"]}
        style={{ flex: 1 }}
      >
     <SafeAreaView style={{ flex: 1, backgroundColor: "transparent", justifyContent: "center", padding: 18 }}>
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        marginTop: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#111" }}>Today</Text>
        <Text style={{ fontSize: 18 }}>{moon}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 14 }} />
      ) : error ? (
        <Text style={{ marginTop: 14, color: "#b00020" }}>{error}</Text>
      ) : dateInfo ? (
        <>
          <Text style={{ marginTop: 14, fontSize: 16, fontWeight: "800", color: "#111" }}>
            {dateInfo.gregorianLabel}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: "#666" }}>
            {dateInfo.hijriLabel}
          </Text>

          <View style={{ height: 1, backgroundColor: "#000", opacity: 0.06, marginVertical: 14 }} />

          <Text style={{ fontSize: 13, fontWeight: "700", color: "#111" }}>Upcoming</Text>

          {upcoming.length === 0 ? (
            <Text style={{ marginTop: 8, fontSize: 13, color: "#666" }}>No upcoming dates found.</Text>
          ) : (
            upcoming.map((m) => (
              <View key={m.title} style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 14, color: "#111", fontWeight: "600" }}>
                  {m.title}{" "}
                  <Text style={{ fontSize: 13, color: "#666", fontWeight: "400" }}>
                    • in {m.inDays} days
                  </Text>
                </Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{m.dateLabel}</Text>
              </View>
            ))
          )}
        </>
      ) : null}
    </View>
    </SafeAreaView>
    </LinearGradient>
  );
}
