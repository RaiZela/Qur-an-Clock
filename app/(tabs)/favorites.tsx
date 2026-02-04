import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

const FAV_KEY = "favorite_ayahs_v1";

type FavoriteAyah = {
  id: string;
  savedAt: number;
  globalAyah: number;
  surahNumber: number;
  ayahInSurah: number;
  surahEnglish: string;
  surahArabic: string;
  arabicAyah: string;
  englishAyah: string;
};

function formatSavedDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export default function FavoritesScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const theme = useMemo(() => {
    return {
      bgGradient: isDark ? (["#0b0b0f", "#12121a"] as const) : (["#f7f7fb", "#e9ecf3"] as const),

      cardBg: isDark ? "#12121a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",

      text: isDark ? "#f5f5ff" : "#111",
      muted: isDark ? "rgba(245,245,255,0.70)" : "#666",
      subtle: isDark ? "rgba(245,245,255,0.55)" : "#777",
      body: isDark ? "rgba(245,245,255,0.86)" : "#333",
      placeholder: isDark ? "rgba(245,245,255,0.40)" : "#999",

      chipBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      divider: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",

      heart: "#e63946",
      danger: "#b00020",
    };
  }, [isDark]);

  const [fontsLoaded] = useFonts({
    Amiri: require("../../assets/fonts/Amiri-Regular.ttf"),
  });

  const [items, setItems] = useState<FavoriteAyah[]>([]);
  const [query, setQuery] = useState("");

  async function loadFavorites() {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }

  async function persist(next: FavoriteAyah[]) {
    setItems(next);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  async function remove(id: string) {
    const next = items.filter((x) => x.id !== id);
    await persist(next);
  }

  async function clearAll() {
    Alert.alert("Clear all saved?", "This will remove all your favorites.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await persist([]);
        },
      },
    ]);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((v) => {
      const ref = `${v.surahNumber}:${v.ayahInSurah}`;
      return (
        v.surahEnglish.toLowerCase().includes(q) ||
        v.englishAyah.toLowerCase().includes(q) ||
        ref.includes(q)
      );
    });
  }, [items, query]);

  if (!fontsLoaded) return null;

  return (
    <LinearGradient colors={theme.bgGradient} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "900", color: theme.text }}>
              Favorites
            </Text>
            <Text style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
              {items.length} saved verse{items.length === 1 ? "" : "s"}
            </Text>
          </View>

          {items.length > 0 ? (
            <Pressable
              onPress={clearAll}
              style={{
                backgroundColor: theme.chipBg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 12, color: theme.text, fontWeight: "700" }}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Search */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color={theme.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by surah, ref (2:255), or words…"
            placeholderTextColor={theme.placeholder}
            style={{ flex: 1, fontSize: 14, color: theme.text }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={theme.subtle} />
            </Pressable>
          ) : null}
        </View>

        {/* Empty state */}
        {items.length === 0 ? (
          <View
            style={{
              marginTop: 18,
              backgroundColor: theme.cardBg,
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>
              No favorites yet
            </Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: theme.muted, lineHeight: 19 }}>
              Tap the heart on the verse card to save a verse. You’ll find it here.
            </Text>
          </View>
        ) : null}

        {/* List */}
        {filtered.map((v) => {
          const ref = `${v.surahNumber}:${v.ayahInSurah}`;
          return (
            <View
              key={v.id}
              style={{
                marginTop: 14,
                backgroundColor: theme.cardBg,
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.18 : 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 7 },
                elevation: isDark ? 2 : 4,
              }}
            >
              {/* Top row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: theme.text }}>
                    {v.surahEnglish} • {ref}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.subtle, marginTop: 3 }}>
                    Saved {formatSavedDate(v.savedAt)} • Global #{v.globalAyah}
                  </Text>
                </View>

                <Pressable onPress={() => remove(v.id)} hitSlop={10}>
                  <Ionicons name="heart" size={22} color={theme.heart} />
                </Pressable>
              </View>

              {/* Arabic */}
              <Text
                style={{
                  marginTop: 14,
                  fontFamily: "Amiri",
                  fontSize: 18,
                  lineHeight: 32,
                  textAlign: "right",
                  color: theme.text,
                }}
                numberOfLines={5}
              >
                {v.arabicAyah}
              </Text>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 14 }} />

              {/* English */}
              <Text style={{ fontSize: 14, lineHeight: 21, color: theme.body }} numberOfLines={6}>
                {v.englishAyah}
              </Text>

              {/* Actions */}
              <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={async () => {
                    const text = `${v.surahEnglish} (${ref})\n\n${v.arabicAyah}\n\n${v.englishAyah}`;
                    await AsyncStorage.setItem("last_copied_preview", text);
                    Alert.alert("Copy", "If you want real copy-to-clipboard, I’ll add it next.");
                  }}
                  style={{
                    backgroundColor: theme.chipBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color={theme.text} />
                  <Text style={{ fontSize: 12, color: theme.text, fontWeight: "700" }}>Copy</Text>
                </Pressable>

                <View
                  style={{
                    backgroundColor: theme.chipBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 12, color: theme.text, fontWeight: "700" }}>
                    {v.surahArabic}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* If search returns none */}
        {items.length > 0 && filtered.length === 0 ? (
          <View
            style={{
              marginTop: 14,
              backgroundColor: theme.cardBg,
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: theme.text }}>No results</Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: theme.muted }}>
              Try searching by surah name (e.g., “Baqarah”) or reference (e.g., “2:255”).
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
