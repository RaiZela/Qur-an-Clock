import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import IslamicCalendarInline from "./islamic-calendar";

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
  id: string; // unique id for dedupe
  savedAt: number;
};

function getGlobalAyahForNow(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dayNumber = Number(`${y}${m}${d}`); // YYYYMMDD

  const minutesToday = date.getHours() * 60 + date.getMinutes();
  const seed = dayNumber * 1440 + minutesToday;

  return (seed % TOTAL_AYAH) + 1; // 1..6236
}

function randomGlobalAyah(): number {
  return Math.floor(Math.random() * TOTAL_AYAH) + 1;
}

export default function Index() {
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
    return `${data.surahNumber}:${data.ayahInSurah}`; // stable unique id
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
    // NOTE: If you refresh within the same minute, "for this minute" verse stays the same.
    // This random refresh gives you a new verse instantly.
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
    // ❌ UNSAVE
    const next = favorites.filter((f) => f.id !== id);
    await persistFavorites(next);
  } else {
    // ❤️ SAVE
    const newFav: FavoriteAyah = {
      ...data,
      id,
      savedAt: Date.now(),
    };
    await persistFavorites([newFav, ...favorites]);
  }
}


  // ✅ effects (all before any return)
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

  // ✅ only now you can return early
  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={["#f7f7fb", "#e9ecf3"]} style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "center",
          padding: 18,
        }}
      >

          <ScrollView
    contentContainerStyle={{
      padding: 18,
      paddingBottom: 40,
    }}
    showsVerticalScrollIndicator={false}
  >
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
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#111" }}>
              Qur’an Clock
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Refresh */}
              <Pressable
                onPress={refreshRandom}
                style={{
                  backgroundColor: "rgba(0,0,0,0.06)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="refresh" size={18} color="#111" />
                <Text style={{ fontSize: 12, color: "#111" }}>Refresh</Text>
              </Pressable>

              {/* Favorite */}
             <Pressable
                  onPress={toggleFavorite}
                  hitSlop={10}
                  style={{
                    padding: 6,
                  }}
                >
                  <Ionicons
                    name={isSaved ? "heart" : "heart-outline"}
                    size={22}
                    color={isSaved ? "#e63946" : "#111"}
                  />
                </Pressable>


              {/* Time chip */}
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.06)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 12, color: "#111" }}>
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          </View>

          {/* BODY */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 26 }} />
          ) : error ? (
            <Text style={{ marginTop: 20, color: "#b00020" }}>{error}</Text>
          ) : data ? (
            <Animated.View style={{ opacity: fade }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 16,
                  color: "#111",
                }}
              >
                {data.surahEnglish}
              </Text>

              <Text
                style={{
                  fontFamily: "Amiri",
                  fontSize: 13,
                  color: "#666",
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
                  backgroundColor: "rgba(0,0,0,0.12)",
                }}
              />

              <Text
                style={{
                  fontFamily: "Amiri",
                  fontSize: 17,
                  lineHeight: 30,
                  textAlign: "right",
                  marginTop: 14,
                  color: "#111",
                }}
              >
                {data.arabicAyah}
              </Text>

              <View
                style={{
                  height: 1,
                  backgroundColor: "#000",
                  opacity: 0.06,
                  marginVertical: 14,
                }}
              />

              <Text style={{ fontSize: 14, lineHeight: 21, color: "#333" }}>
                {data.englishAyah}
              </Text>

              <View
                style={{
                  marginTop: 14,
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(0,0,0,0.06)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 12, color: "#222" }}>
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
