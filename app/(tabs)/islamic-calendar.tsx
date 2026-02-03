import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type HijriInfo = {
  hijriLabel: string;
  gregorianLabel: string;
};

type Milestone = { title: string; dateLabel: string; inDays: number };

const MILESTONES = [
  { title: "Ramadan", hijriMonth: 9, hijriDay: 1 },
  { title: "Dhul Hijjah", hijriMonth: 12, hijriDay: 1 },
  { title: "Day of Arafah", hijriMonth: 12, hijriDay: 9 },
  { title: "Eid al-Adha", hijriMonth: 12, hijriDay: 10 },
  { title: "Islamic New Year", hijriMonth: 1, hijriDay: 1 },
];

// ✅ Info shown when user taps a mini-card
type IslamicEventInfo = {
  key: string;
  title: string;
  icon: string;
  description: string;
};

const ISLAMIC_EVENTS: IslamicEventInfo[] = [
  {
    key: "ramadan",
    title: "Ramadan",
    icon: "🌙",
    description:
      "Ramadan is the month in which the Qur’an was revealed. Muslims fast from dawn to sunset, focusing on worship, self-discipline, and closeness to God.",
  },
  {
    key: "dhulhijjah",
    title: "Dhul Hijjah",
    icon: "🕋",
    description:
      "Dhul Hijjah is the month of Hajj. Its first ten days are among the most blessed days in Islam.",
  },
  {
    key: "arafah",
    title: "Day of Arafah",
    icon: "⛰️",
    description:
      "The Day of Arafah is the most sacred day of Hajj. Many Muslims fast on this day, seeking forgiveness and mercy.",
  },
  {
    key: "eidadha",
    title: "Eid al-Adha",
    icon: "🎉",
    description:
      "Eid al-Adha commemorates Ibrahim’s devotion. It is marked by prayer, charity, and remembrance of God.",
  },
  {
    key: "newyear",
    title: "Islamic New Year",
    icon: "✨",
    description:
      "The Islamic New Year marks the start of the Hijri calendar year (Muharram). Many use it for reflection and fresh intentions.",
  },
];

function slugTitle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("ramadan")) return "ramadan";
  if (t.includes("dhul")) return "dhulhijjah";
  if (t.includes("arafah")) return "arafah";
  if (t.includes("eid")) return "eidadha";
  if (t.includes("new year")) return "newyear";
  return "other";
}

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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Text style={{ fontSize: 12, color: "#111", fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

function EventMiniCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 150,
        borderRadius: 18,
        padding: 12,
        backgroundColor: "rgba(0,0,0,0.04)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.9)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#111" }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function IslamicCalendarInline() {
  const [loading, setLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState<HijriInfo | null>(null);
  const [moon, setMoon] = useState("🌙");
  const [upcoming, setUpcoming] = useState<Milestone[]>([]);
  const [error, setError] = useState("");

  // ✅ which event is expanded
  const [openEventKey, setOpenEventKey] = useState<string | null>(null);

  // map milestones -> card items with icon + key
  const upcomingCards = useMemo(() => {
    return upcoming.slice(0, 3).map((m) => {
      const key = slugTitle(m.title);
      const info =
        ISLAMIC_EVENTS.find((x) => x.key === key) ??
        ({ key: "other", title: m.title, icon: "📅", description: "A special day in the Islamic calendar." } as IslamicEventInfo);

      return {
        milestone: m,
        info,
      };
    });
  }, [upcoming]);

  const openInfo = useMemo(() => {
    if (!openEventKey) return null;
    return ISLAMIC_EVENTS.find((e) => e.key === openEventKey) ?? null;
  }, [openEventKey]);

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
    <View
      style={{
        marginTop: 14,
        borderRadius: 22,
        padding: 0,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderWidth: 0,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#111" }}>Today</Text>

       
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : error ? (
        <Text style={{ marginTop: 12, color: "#b00020" }}>{error}</Text>
      ) : dateInfo ? (
        <>
          {/* Date pills */}

           <View style={{ marginTop: 10 }}>
                <EventMiniCard
                  icon={moon}
                  title={dateInfo.hijriLabel}
                  subtitle={dateInfo.gregorianLabel}
                  onPress={() => {}}
                />
              </View>
       
          {/* Upcoming mini cards */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 12, color: "#666", fontWeight: "700" }}>UPCOMING</Text>

            {upcomingCards.length === 0 ? (
              <View style={{ marginTop: 10 }}>
                <EventMiniCard
                  icon="📅"
                  title="No upcoming"
                  subtitle="Try again later"
                  onPress={() => {}}
                />
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10, width: "50%" }}>
                {upcomingCards.map(({ milestone, info }) => {
                  const isOpen = openEventKey === info.key;

                  return (
                    <EventMiniCard
                      key={milestone.title}
                      icon={info.icon}
                      title={info.title}
                      subtitle={`in ${milestone.inDays} days`}
                      onPress={() => setOpenEventKey(isOpen ? null : info.key)}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Expanded info panel */}
          {openInfo ? (
            <View
              style={{
                marginTop: 14,
                backgroundColor: "rgba(0,0,0,0.04)",
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>
                {openInfo.icon} {openInfo.title}
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  lineHeight: 19,
                  color: "#333",
                }}
              >
                {openInfo.description}
              </Text>

              {/* Optional: show the exact date from milestone if it matches */}
              <Text style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                Tip: we can add “Read more” later, or show sources.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
