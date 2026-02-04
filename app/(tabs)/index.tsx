import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, useColorScheme } from "react-native";
import IslamicCalendarInline from "../islamic-calendar";

import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

const TOTAL_AYAH = 6236;
const FAV_KEY = "favorite_ayahs_v1";

type VerseData = {
  globalAyah: number;
  arabicAyah: string;
  englishAyah: string;
  surahArabic: string;
  surahEnglish: string;
  ayahInSurah: number;
  surahNumber: number;
};

type FavoriteAyah = VerseData & {
  id: string;
  savedAt: number;
};

function getGlobalAyahForNow(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dayNumber = Number(`${y}${m}${d}`);

  const minutesToday = date.getHours() * 60 + date.getMinutes();
  const seed = dayNumber * 1440 + minutesToday;

  return (seed % TOTAL_AYAH) + 1;
}

function randomGlobalAyah(): number {
  return Math.floor(Math.random() * TOTAL_AYAH) + 1;
}

export default function Index() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const theme = useMemo(() => {
    return {
      bgGradient: isDark ? (["#0b0b0f", "#12121a"] as const) : (["#f7f7fb", "#e9ecf3"] as const),

      cardBg: isDark ? "#12121a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      shadow: isDark ? "#000" : "#000",

      text: isDark ? "#f5f5ff" : "#111111",
      muted: isDark ? "rgba(245,245,255,0.70)" : "#666666",
      body: isDark ? "rgba(245,245,255,0.86)" : "#333333",

      chipBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      divider: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",

      danger: "#b00020",
      heart: "#e63946",
    };
  }, [isDark]);

  // ✅ hooks first (INCLUDING useFonts)
  const [fontsLoaded] = useFonts({
    Amiri: require("../../assets/fonts/Amiri-Regular.ttf"),
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VerseData | null>(null);
  const [now, setNow] = useState(new Date());

  const [favorites, setFavorites] = useState<FavoriteAyah[]>([]);
  const fade = useState(new Animated.Value(0))[0];

  const currentFavId = useMemo(() => {
    if (!data) return "";
    return `${data.surahNumber}:${data.ayahInSurah}`;
  }, [data]);

  const isSaved = useMemo(() => {
    if (!currentFavId) return false;
    return favorites.some((f) => f.id === currentFavId);
  }, [favorites, currentFavId]);

  function playFadeIn() {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }

  async function fetchVerse(globalAyah: number) {
    const arRes = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}`);
    const arJson = await arRes.json();
    if (arJson?.status !== "OK") throw new Error("Failed to fetch Arabic verse");

    const enRes = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/en.sahih`);
    const enJson = await enRes.json();
    if (enJson?.status !== "OK") throw new Error("Failed to fetch English translation");

    const v: VerseData = {
      globalAyah,
      arabicAyah: arJson.data.text,
      englishAyah: enJson.data.text,
      surahArabic: arJson.data.surah.name,
      surahEnglish: arJson.data.surah.englishName,
      ayahInSurah: arJson.data.numberInSurah,
      surahNumber: arJson.data.surah.number,
    };

    setData(v);
  }

  async function loadForThisMinute() {
    setLoading(true);
    setError("");
    try {
      const globalAyah = getGlobalAyahForNow();
      await fetchVerse(globalAyah);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRandom() {
    setLoading(true);
    setError("");
    try {
      await fetchVerse(randomGlobalAyah());
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    setFavorites(raw ? JSON.parse(raw) : []);
  }

  async function persistFavorites(next: FavoriteAyah[]) {
    setFavorites(next);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  async function toggleFavorite() {
    if (!data) return;

    const id = `${data.surahNumber}:${data.ayahInSurah}`;
    const exists = favorites.some((f) => f.id === id);

    if (exists) {
      const next = favorites.filter((f) => f.id !== id);
      await persistFavorites(next);
    } else {
      const newFav: FavoriteAyah = { ...data, id, savedAt: Date.now() };
      await persistFavorites([newFav, ...favorites]);
    }
  }

  useEffect(() => {
    loadFavorites();
    loadForThisMinute();
  }, []);

  useEffect(() => {
    if (data) playFadeIn();
  }, [data]);

  useEffect(() => {
    let intervalId: any;
    let timeoutId: any;

    function tick() {
      const d = new Date();
      setNow(d);
      loadForThisMinute();
    }

    const msToNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();

    timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={theme.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,

              // shadows still ok; on dark mode keep subtle
              shadowColor: theme.shadow,
              shadowOpacity: isDark ? 0.18 : 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: isDark ? 2 : 6,
            }}
          >
            {/* HEADER */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>
                Qur’an Clock
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {/* Refresh */}
                <Pressable
                  onPress={refreshRandom}
                  style={{
                    backgroundColor: theme.chipBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Ionicons name="refresh" size={18} color={theme.text} />
                  <Text style={{ fontSize: 12, color: theme.text }}>Refresh</Text>
                </Pressable>

                {/* Favorite */}
                <Pressable onPress={toggleFavorite} hitSlop={10} style={{ padding: 6 }}>
                  <Ionicons
                    name={isSaved ? "heart" : "heart-outline"}
                    size={22}
                    color={isSaved ? theme.heart : theme.text}
                  />
                </Pressable>

                {/* Time chip */}
                <View
                  style={{
                    backgroundColor: theme.chipBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.text }}>
                    {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            </View>

            {/* BODY */}
            {loading ? (
              <ActivityIndicator style={{ marginTop: 26 }} />
            ) : error ? (
              <Text style={{ marginTop: 20, color: theme.danger }}>{error}</Text>
            ) : data ? (
              <Animated.View style={{ opacity: fade }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    marginTop: 16,
                    color: theme.text,
                  }}
                >
                  {data.surahEnglish}
                </Text>

                <Text
                  style={{
                    fontFamily: "Amiri",
                    fontSize: 13,
                    color: theme.muted,
                    marginTop: 4,
                  }}
                >
                  {data.surahArabic}
                </Text>

                <View
                  style={{
                    marginTop: 14,
                    height: 3,
                    width: 44,
                    borderRadius: 999,
                    backgroundColor: theme.chipBg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                />

                <Text
                  style={{
                    fontFamily: "Amiri",
                    fontSize: 17,
                    lineHeight: 30,
                    textAlign: "right",
                    marginTop: 14,
                    color: theme.text,
                  }}
                >
                  {data.arabicAyah}
                </Text>

                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.divider,
                    marginVertical: 14,
                  }}
                />

                <Text style={{ fontSize: 14, lineHeight: 21, color: theme.body }}>
                  {data.englishAyah}
                </Text>

                <View
                  style={{
                    marginTop: 14,
                    alignSelf: "flex-start",
                    backgroundColor: theme.chipBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.text }}>
                    {data.surahNumber}:{data.ayahInSurah} • Global #{data.globalAyah}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            <IslamicCalendarInline />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
