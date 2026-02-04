import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";

type SurahMeta = {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
};

const LANG_KEY = "surah_lang_v1"; // "ar" | "en"

export default function SurahsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();

  const t = useMemo(() => {
    return {
      bg: isDark ? "#0b0b0f" : "#f7f7fb",
      card: isDark ? "#12121a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      text: isDark ? "#f5f5ff" : "#111",
      muted: isDark ? "rgba(245,245,255,0.70)" : "#666",
      chip: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    };
  }, [isDark]);

  const [loading, setLoading] = useState(true);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [lang, setLang] = useState<"ar" | "en">("en");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === "ar" || saved === "en") setLang(saved);

        const res = await fetch("https://api.alquran.cloud/v1/surah");
        const json = await res.json();
        const data = (json?.data ?? []) as SurahMeta[];
        setSurahs(data);
      } catch {
        setSurahs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function setLanguage(next: "ar" | "en") {
    setLang(next);
    await AsyncStorage.setItem(LANG_KEY, next);
  }

  function openSurah(n: number) {
    router.push({ pathname: "/surah/[number]", params: { number: String(n), lang } });
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: { flex: 1, backgroundColor: t.bg, padding: 16 },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        },
        title: { fontSize: 22, fontWeight: "900", color: t.text },
        toggleWrap: { flexDirection: "row", gap: 8 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: t.chip,
          borderWidth: 1,
          borderColor: t.border,
        },
        chipActive: {
          backgroundColor: t.card,
        },
        chipText: { color: t.muted, fontWeight: "800", fontSize: 12 },
        chipTextActive: { color: t.text },

        item: {
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 18,
          padding: 14,
          marginBottom: 10,
        },
        rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 10 },
        num: {
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: t.chip,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: "center",
          justifyContent: "center",
        },
        numText: { color: t.text, fontWeight: "900" },
        nameWrap: { flex: 1 },
        name: { color: t.text, fontWeight: "900", fontSize: 14 },
        sub: { color: t.muted, marginTop: 2, fontSize: 12 },
        arabic: { color: t.text, fontWeight: "900", fontSize: 16 },
      }),
    [t]
  );

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Surahs</Text>

        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setLanguage("en")}
            style={[styles.chip, lang === "en" && styles.chipActive]}
          >
            <Text style={[styles.chipText, lang === "en" && styles.chipTextActive]}>English</Text>
          </Pressable>

          <Pressable
            onPress={() => setLanguage("ar")}
            style={[styles.chip, lang === "ar" && styles.chipActive]}
          >
            <Text style={[styles.chipText, lang === "ar" && styles.chipTextActive]}>Arabic</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={surahs}
          keyExtractor={(s) => String(s.number)}
          renderItem={({ item }) => (
            <Pressable onPress={() => openSurah(item.number)} style={styles.item}>
              <View style={styles.rowTop}>
                <View style={styles.left}>
                  <View style={styles.num}>
                    <Text style={styles.numText}>{item.number}</Text>
                  </View>

                  <View style={styles.nameWrap}>
                    <Text style={styles.name}>
                      {item.englishName} • {item.numberOfAyahs} ayahs
                    </Text>
                    <Text style={styles.sub}>{item.englishNameTranslation}</Text>
                  </View>
                </View>

                <Text style={styles.arabic}>{item.name}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
