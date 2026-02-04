import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

type GratitudeItem = {
  id: string;
  text: string;
  createdAt: number;
};

const STORAGE_KEY = "gratitude_items_v1";

export default function Gratitude() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const t = useMemo(() => {
    return {
      pageBg: isDark ? "#0b0b0f" : "#F7F6F3",

      cardBg: isDark ? "#12121a" : "#FFFFFF",
      softBg: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
      border: isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB",

      text: isDark ? "#f5f5ff" : "#111827",
      subtext: isDark ? "rgba(245,245,255,0.80)" : "#374151",
      muted: isDark ? "rgba(245,245,255,0.55)" : "#6B7280",

      btnBg: isDark ? "#f5f5ff" : "#111827",
      btnText: isDark ? "#0b0b0f" : "#F9FAFB",
    };
  }, [isDark]);

  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Load saved items once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: GratitudeItem[] = raw ? JSON.parse(raw) : [];
        setItems(parsed);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save items whenever they change (after initial load)
  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loading]);

  const countText = useMemo(
    () => `${items.length} gratitude${items.length === 1 ? "" : "s"}`,
    [items.length]
  );

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newItem: GratitudeItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text: trimmed,
      createdAt: Date.now(),
    };

    setItems((prev) => [newItem, ...prev]);
    setText("");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  // 👇 build styles from theme (so dark mode updates instantly)
  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: {
          flex: 1,
          backgroundColor: t.pageBg,
        },

        header: {
          paddingTop: 54,
          paddingHorizontal: 20,
          paddingBottom: 16,
        },
        title: {
          fontSize: 30,
          fontWeight: "800",
          color: t.text,
          marginBottom: 6,
        },
        subtitle: {
          fontSize: 15,
          color: t.subtext,
        },
        pillRow: {
          marginTop: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        pill: {
          backgroundColor: t.cardBg,
          borderRadius: 999,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: t.border,
        },
        pillText: {
          color: t.text,
          fontWeight: "600",
          fontSize: 13,
        },
        clearBtn: {
          backgroundColor: t.btnBg,
          borderRadius: 999,
          paddingVertical: 8,
          paddingHorizontal: 14,
        },
        clearBtnText: {
          color: t.btnText,
          fontWeight: "700",
          fontSize: 13,
        },

        card: {
          marginHorizontal: 20,
          backgroundColor: t.cardBg,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: t.border,
        },
        label: {
          fontSize: 13,
          fontWeight: "700",
          color: t.text,
          marginBottom: 10,
        },
        inputRow: {
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        },
        input: {
          flex: 1,
          height: 46,
          borderRadius: 14,
          paddingHorizontal: 14,
          backgroundColor: t.softBg,
          color: t.text,
          fontSize: 15,
        },
        addBtn: {
          height: 46,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: t.btnBg,
          alignItems: "center",
          justifyContent: "center",
        },
        addBtnText: {
          color: t.btnText,
          fontWeight: "800",
          fontSize: 14,
        },
        hint: {
          marginTop: 10,
          fontSize: 12,
          color: t.muted,
        },

        listWrap: {
          flex: 1,
          marginTop: 12,
        },
        listContent: {
          paddingHorizontal: 20,
          paddingBottom: 26,
          paddingTop: 10,
        },

        empty: {
          marginTop: 50,
          alignItems: "center",
          paddingHorizontal: 20,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: "800",
          color: t.text,
          marginBottom: 6,
        },
        emptyText: {
          fontSize: 14,
          color: t.muted,
          textAlign: "center",
        },

        item: {
          backgroundColor: t.cardBg,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: t.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        },
        itemLeft: {
          width: 30,
          alignItems: "center",
          justifyContent: "center",
        },
        itemIndex: {
          fontWeight: "800",
          color: t.text,
          fontSize: 14,
        },
        itemBody: {
          flex: 1,
          paddingHorizontal: 8,
        },
        itemText: {
          fontSize: 15,
          color: t.text,
          fontWeight: "600",
          marginBottom: 4,
        },
        itemMeta: {
          fontSize: 11,
          color: t.muted,
        },
        deleteBtn: {
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: t.softBg,
          alignItems: "center",
          justifyContent: "center",
        },
        deleteBtnText: {
          fontSize: 16,
          fontWeight: "900",
          color: t.text,
        },
      }),
    [t]
  );

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gratitude</Text>
        <Text style={styles.subtitle}>What are you grateful for today?</Text>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{countText}</Text>
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input card */}
      <View style={styles.card}>
        <Text style={styles.label}>Add one thing</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g., my family, a calm moment, health..."
            placeholderTextColor={t.muted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addItem}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Tip: keep it short. One line is enough.</Text>
      </View>

      {/* List */}
      <View style={styles.listWrap}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing yet 🌿</Text>
              <Text style={styles.emptyText}>Add your first gratitude above.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemIndex}>{index + 1}</Text>
              </View>

              <View style={styles.itemBody}>
                <Text style={styles.itemText}>{item.text}</Text>
                <Text style={styles.itemMeta}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeItem(item.id)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
