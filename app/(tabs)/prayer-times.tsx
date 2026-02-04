import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

type PrayerTimes = Record<string, string>;
type AlarmIds = Record<string, string>; // prayerKey -> scheduledNotificationId
type AlarmNext = Record<string, string>; // prayerKey -> human readable next scheduled time

const DAILY_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const ALARM_IDS_KEY = "prayer_alarm_ids_v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export default function PrayerTimesScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const t = useMemo(() => {
    return {
      pageBg: isDark ? "#0b0b0f" : "#f5f5f5",
      cardBg: isDark ? "#12121a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
      divider: isDark ? "rgba(255,255,255,0.10)" : "#ddd",
      text: isDark ? "#f5f5ff" : "#2c3e50",
      title: isDark ? "#f5f5ff" : "#34495e",
      muted: isDark ? "rgba(245,245,255,0.70)" : "#2c3e50",
      subtle: isDark ? "rgba(245,245,255,0.55)" : "#6B7280",
      highlightBg: isDark ? "rgba(255,255,255,0.06)" : "#fdebd0",
      highlightBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      alarmOn: "#f00000",
      danger: "#b00020",
    };
  }, [isDark]);

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState<string>("");
  const [alarmIds, setAlarmIds] = useState<AlarmIds>({});
  const [alarmNext, setAlarmNext] = useState<AlarmNext>({});
  const [error, setError] = useState("");

  const appState = useRef(AppState.currentState);

  async function ensureAndroidChannel() {
    if (Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("prayers", {
      name: "Prayer reminders",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  async function ensurePermission(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    return finalStatus === "granted";
  }

  function parseTimeToNextOccurrence(timeStr: string): Date {
    const [hh, mm] = timeStr.split(":").map((x) => Number(x));
    const now = new Date();

    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh,
      mm,
      0,
      0
    );

    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  function getNextPrayerKey(timings: PrayerTimes) {
    const now = new Date();
    const today = new Date();

    for (const key of DAILY_PRAYERS) {
      const value = timings[key];
      if (!value) continue;

      const [hours, minutes] = value.split(":").map(Number);
      const prayerTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
        0,
        0
      );

      if (prayerTime > now) return key;
    }
    return "Fajr";
  }

  function formatWhen(d: Date) {
    return d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  }

  async function loadAlarmIds() {
    const raw = await AsyncStorage.getItem(ALARM_IDS_KEY);
    const parsed: AlarmIds = raw ? JSON.parse(raw) : {};
    setAlarmIds(parsed);
    return parsed;
  }

  async function saveAlarmIds(next: AlarmIds) {
    setAlarmIds(next);
    await AsyncStorage.setItem(ALARM_IDS_KEY, JSON.stringify(next));
  }

  async function cancelIfExists(id?: string) {
    if (!id) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }

  // Schedules ONE notification in the future (today or tomorrow) for that prayer
  async function scheduleOne(prayerKey: string, timeStr: string): Promise<{ id: string; when: Date }> {
    await ensureAndroidChannel();

    const ok = await ensurePermission();
    if (!ok) throw new Error("Notifications permission not granted");

    const when = parseTimeToNextOccurrence(timeStr);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Prayer time",
        body: `It’s time for ${prayerKey}.`,
        sound: true,
      },
      trigger: {
        date: when,
        channelId: Platform.OS === "android" ? "prayers" : undefined,
      } as Notifications.NotificationTriggerInput,
    });

    return { id, when };
  }

  // ✅ Reschedule enabled prayers (the ones that are ON)
  async function rescheduleEnabled(timings: PrayerTimes, currentIds: AlarmIds) {
    const nextIds: AlarmIds = { ...currentIds };
    const nextNext: AlarmNext = { ...alarmNext };

    for (const key of DAILY_PRAYERS) {
      const enabled = !!currentIds[key];
      if (!enabled) continue;

      const timeStr = timings[key];
      if (!timeStr) continue;

      // cancel old schedule then schedule the next occurrence
      await cancelIfExists(currentIds[key]);
      const { id, when } = await scheduleOne(key, timeStr);

      nextIds[key] = id;
      nextNext[key] = formatWhen(when);
    }

    setAlarmNext(nextNext);
    await saveAlarmIds(nextIds);
  }

  async function fetchTimesAndReschedule(mode: "initial" | "refresh") {
    try {
      if (mode === "initial") setLoading(true);
      setError("");

      const stored = mode === "initial" ? await loadAlarmIds() : alarmIds;

      const res = await axios.get(
        "https://api.aladhan.com/v1/timingsByCity?city=Tirana&country=Albania&method=2"
      );

      const timings: PrayerTimes = res.data.data.timings;

      setPrayerTimes(timings);
      setNextPrayer(getNextPrayerKey(timings));

      // Build a display of next scheduled time for enabled ones
      const nextDisplay: AlarmNext = {};
      for (const key of DAILY_PRAYERS) {
        if (!stored[key]) continue;
        const when = parseTimeToNextOccurrence(timings[key]);
        nextDisplay[key] = formatWhen(when);
      }
      setAlarmNext(nextDisplay);

      // Reschedule enabled prayers to match today's timings
      await rescheduleEnabled(timings, stored);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load prayer times");
    } finally {
      if (mode === "initial") setLoading(false);
    }
  }

  // Toggle ON/OFF: ON schedules a future alarm (no instant notification)
  async function togglePrayer(key: typeof DAILY_PRAYERS[number]) {
    if (!prayerTimes) return;

    const timeStr = prayerTimes[key];
    if (!timeStr) return;

    const existingId = alarmIds[key];

    // OFF
    if (existingId) {
      await cancelIfExists(existingId);
      const next = { ...alarmIds };
      delete next[key];
      await saveAlarmIds(next);

      setAlarmNext((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });

      return;
    }

    // ON (schedule next occurrence)
    try {
      const { id, when } = await scheduleOne(key, timeStr);
      const next = { ...alarmIds, [key]: id };
      await saveAlarmIds(next);

      setAlarmNext((prev) => ({ ...prev, [key]: formatWhen(when) }));
    } catch (e: any) {
      setError(e?.message ?? "Could not schedule notification");
    }
  }

  useEffect(() => {
    fetchTimesAndReschedule("initial");

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev.match(/inactive|background/) && nextState === "active") {
        fetchTimesAndReschedule("refresh");
      }
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: t.pageBg,
        },
        title: {
          fontSize: 24,
          fontWeight: "900",
          marginBottom: 10,
          color: t.title,
        },
        error: {
          color: t.danger,
          marginBottom: 10,
          textAlign: "center",
        },
        card: {
          width: "100%",
          backgroundColor: t.cardBg,
          borderRadius: 18,
          padding: 18,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.18 : 0.12,
          shadowRadius: 10,
          elevation: isDark ? 2 : 5,
        },
        rowItem: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.divider,
          alignItems: "center",
          borderRadius: 12,
          paddingHorizontal: 8,
        },
        selectedRow: {
          backgroundColor: t.highlightBg,
          borderWidth: 1,
          borderColor: t.highlightBorder,
        },
        labelWrap: { flexDirection: "column" },
        label: { fontSize: 16, color: t.text, fontWeight: "800" },
        sub: { marginTop: 2, fontSize: 11, color: t.subtle, fontWeight: "700" },

        time: { fontSize: 16, color: t.text, fontWeight: "800" },
        right: { flexDirection: "row", alignItems: "center" },
        icon: { marginLeft: 10 },
      }),
    [t, isDark]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prayer Times • Tirana</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.card}>
        {DAILY_PRAYERS.map((key) => {
          const value = prayerTimes?.[key] ?? "--:--";
          const isNext = key === nextPrayer;
          const isAlarmOn = !!alarmIds[key];

          return (
            <View key={key} style={[styles.rowItem, isNext && styles.selectedRow]}>
              <View style={styles.labelWrap}>
                <Text style={styles.label}>{key}</Text>
                {isAlarmOn && alarmNext[key] ? (
                  <Text style={styles.sub}>Scheduled: {alarmNext[key]}</Text>
                ) : null}
              </View>

              <View style={styles.right}>
                <Text style={styles.time}>{value}</Text>

                <Pressable onPress={() => togglePrayer(key)} hitSlop={10}>
                  <Ionicons
                    name={isAlarmOn ? "notifications" : "notifications-outline"}
                    size={20}
                    color={isAlarmOn ? t.alarmOn : t.muted}
                    style={styles.icon}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
