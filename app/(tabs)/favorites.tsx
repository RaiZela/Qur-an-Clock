import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

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
    <LinearGradient colors={["#f7f7fb", "#e9ecf3"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>Favorites</Text>
            <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
              {items.length} saved verse{items.length === 1 ? "" : "s"}
            </Text>
          </View>

          {items.length > 0 ? (
            <Pressable
              onPress={clearAll}
              style={{
                backgroundColor: "rgba(0,0,0,0.06)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 12, color: "#111", fontWeight: "700" }}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Search */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: "#fff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by surah, ref (2:255), or words…"
            placeholderTextColor="#999"
            style={{ flex: 1, fontSize: 14, color: "#111" }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#777" />
            </Pressable>
          ) : null}
        </View>

        {/* Empty state */}
        {items.length === 0 ? (
          <View
            style={{
              marginTop: 18,
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111" }}>No favorites yet</Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: "#666", lineHeight: 19 }}>
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
                backgroundColor: "#fff",
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 7 },
                elevation: 4,
              }}
            >
              {/* Top row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
                    {v.surahEnglish} • {ref}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#777", marginTop: 3 }}>
                    Saved {formatSavedDate(v.savedAt)} • Global #{v.globalAyah}
                  </Text>
                </View>

                <Pressable onPress={() => remove(v.id)} hitSlop={10}>
                  <Ionicons name="heart" size={22} color="#e63946" />
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
                  color: "#111",
                }}
                numberOfLines={5}
              >
                {v.arabicAyah}
              </Text>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: "#000", opacity: 0.06, marginVertical: 14 }} />

              {/* English */}
              <Text style={{ fontSize: 14, lineHeight: 21, color: "#333" }} numberOfLines={6}>
                {v.englishAyah}
              </Text>

              {/* Actions */}
              <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={async () => {
                    const text = `${v.surahEnglish} (${ref})\n\n${v.arabicAyah}\n\n${v.englishAyah}`;
                    await AsyncStorage.setItem("last_copied_preview", text); // optional small debug
                    // If you want actual clipboard, tell me and I’ll add expo-clipboard.
                    Alert.alert("Copy", "If you want real copy-to-clipboard, I’ll add it next.");
                  }}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.06)",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color="#111" />
                  <Text style={{ fontSize: 12, color: "#111", fontWeight: "700" }}>Copy</Text>
                </Pressable>

                <View
                  style={{
                    backgroundColor: "rgba(0,0,0,0.06)",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#111", fontWeight: "700" }}>
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
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#111" }}>No results</Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
              Try searching by surah name (e.g., “Baqarah”) or reference (e.g., “2:255”).
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
