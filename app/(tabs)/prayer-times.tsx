import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

type PrayerTimes = Record<string, string>;

const DAILY_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export default function PrayerTimesScreen() {
  // ✅ hooks always first
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchTimes() {
      try {
        const res = await axios.get(
          "https://api.aladhan.com/v1/timingsByCity?city=Tirana&country=Albania&method=2"
        );

        const timings: PrayerTimes = res.data.data.timings;

        if (!isMounted) return;

        setPrayerTimes(timings);
        setNextPrayer(getNextPrayerKey(timings));
      } catch (e) {
        console.log(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTimes();

    return () => {
      isMounted = false;
    };
  }, []);

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
        minutes
      );

      if (prayerTime > now) return key;
    }

    // if we're past Isha, treat next as tomorrow's Fajr
    return "Fajr";
  }

  // ✅ returns after hooks
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prayer Times for Tirana</Text>

      <View style={styles.card}>
        {DAILY_PRAYERS.map((key) => {
          const value = prayerTimes?.[key] ?? "--:--";
          const isNext = key === nextPrayer;

          return (
            <View key={key} style={[styles.rowItem, isNext && styles.selectedRow]}>
              <Text style={styles.time}>{key}:</Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.time}>{value}</Text>
                <Ionicons
                  name={isNext ? "notifications" : "notifications-outline"}
                  size={20}
                  color={isNext ? "#d35400" : "#2c3e50"}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, color: "#34495e" },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  selectedRow: {
    backgroundColor: "#fdebd0",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  time: { fontSize: 18, color: "#2c3e50" },
});
