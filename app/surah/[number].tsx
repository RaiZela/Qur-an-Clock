import { useFonts } from "expo-font";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";

type Ayah = { numberInSurah: number; text: string };

export default function SurahReader() {
  const { number, lang } = useLocalSearchParams<{ number: string; lang?: string }>();
  const surahNumber = Number(number);
  const selectedLang: "ar" | "en" = lang === "ar" ? "ar" : "en";

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [fontsLoaded] = useFonts({
    Amiri: require("../../assets/fonts/Amiri-Regular.ttf"),
  });

  const t = useMemo(() => {
    return {
      bg: isDark ? "#0b0b0f" : "#f7f7fb",
      card: isDark ? "#12121a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      text: isDark ? "#f5f5ff" : "#111",
      muted: isDark ? "rgba(245,245,255,0.70)" : "#666",
      body: isDark ? "rgba(245,245,255,0.86)" : "#333",
      danger: "#b00020",
    };
  }, [isDark]);

  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState(`Surah ${surahNumber}`);
  const [subtitle, setSubtitle] = useState(""); // Arabic name
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const endpoint =
          selectedLang === "ar"
            ? `https://api.alquran.cloud/v1/surah/${surahNumber}`
            : `https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`;

        const res = await fetch(endpoint);
        const json = await res.json();

        const data = json?.data;
        const title = data?.englishName ?? `Surah ${surahNumber}`;
        const arName = data?.name ?? "";

        if (!alive) return;

        setHeaderTitle(title);
        setSubtitle(arName);

        const list = (data?.ayahs ?? []).map((a: any) => ({
          numberInSurah: a.numberInSurah,
          text: a.text,
        }));

        setAyahs(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load surah");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [surahNumber, selectedLang]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: { flex: 1, backgroundColor: t.bg },
        wrap: { padding: 16, paddingBottom: 28 },

        headerCard: {
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
        },
        h1: { color: t.text, fontSize: 20, fontWeight: "900" },
        h2: { color: t.muted, marginTop: 4, fontSize: 13, fontWeight: "700" },

        ayahCard: {
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 18,
          padding: 14,
          marginBottom: 10,
        },
        ayahNum: { color: t.muted, fontWeight: "900", marginBottom: 8 },

        ayahTextAr: {
          color: t.text,
          fontSize: 18,
          lineHeight: 34,
          textAlign: "right",
          fontFamily: "Amiri",
        },
        ayahTextEn: {
          color: t.body,
          fontSize: 15,
          lineHeight: 22,
        },

        error: { color: t.danger, marginTop: 12 },
      }),
    [t]
  );

  // wait for font only when Arabic is selected
  if (selectedLang === "ar" && !fontsLoaded) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: headerTitle,
          headerShown: true,
        }}
      />

      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.headerCard}>
            <Text style={styles.h1}>{headerTitle}</Text>
            {!!subtitle && <Text style={styles.h2}>{subtitle}</Text>}
            <Text style={styles.h2}>Reading: {selectedLang === "ar" ? "Arabic" : "English"}</Text>
          </View>

          {loading ? (
            <ActivityIndicator />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            ayahs.map((a) => (
              <View key={a.numberInSurah} style={styles.ayahCard}>
                <Text style={styles.ayahNum}>Ayah {a.numberInSurah}</Text>
                <Text style={selectedLang === "ar" ? styles.ayahTextAr : styles.ayahTextEn}>
                  {a.text}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}
