import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AppState,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type ChatMessage = {
  id: string;
  text: string;
  createdAt: string; // ISO
};

type ListItem =
  | { type: "day"; id: string; title: string }
  | { type: "msg"; id: string; msg: ChatMessage };

const STORAGE_MESSAGES = "god_chat_messages_v1";
const STORAGE_LAST_DAY = "god_chat_last_day_v1";

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayTitle(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GodChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ListItem>>(null);

  const todayKey = getDayKey(new Date());

  // Wipe messages if a new day started (only keep today)
  const ensureTodayOnly = async () => {
    const nowKey = getDayKey(new Date());
    const lastKey = await AsyncStorage.getItem(STORAGE_LAST_DAY);

    if (lastKey !== nowKey) {
      // new day -> delete old messages
      await AsyncStorage.removeItem(STORAGE_MESSAGES);
      await AsyncStorage.setItem(STORAGE_LAST_DAY, nowKey);
      setMessages([]);
      return;
    }

    // set if missing
    if (!lastKey) {
      await AsyncStorage.setItem(STORAGE_LAST_DAY, nowKey);
    }
  };

  // Load
  useEffect(() => {
    (async () => {
      await ensureTodayOnly();

      try {
        const raw = await AsyncStorage.getItem(STORAGE_MESSAGES);
        if (!raw) return;

        const parsed = JSON.parse(raw) as ChatMessage[];
        // keep only today's, just in case
        const filtered = parsed.filter((m) =>
          isSameDay(new Date(m.createdAt), new Date())
        );
        filtered.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        setMessages(filtered);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also check day change when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await ensureTodayOnly();
      }
    });
    return () => sub.remove();
  }, []);

  // Save
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
        await AsyncStorage.setItem(STORAGE_LAST_DAY, getDayKey(new Date()));
      } catch {
        // ignore
      }
    })();
  }, [messages]);

  const items: ListItem[] = useMemo(() => {
    const out: ListItem[] = [];
    let lastDay: string | null = null;

    for (const msg of messages) {
      const d = new Date(msg.createdAt);
      const key = getDayKey(d);

      if (key !== lastDay) {
        out.push({
          type: "day",
          id: `day-${key}`,
          title: dayTitle(d),
        });
        lastDay = key;
      }

      out.push({ type: "msg", id: msg.id, msg });
    }

    return out;
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // ensure we’re still on today (if midnight passed)
    await ensureTodayOnly();

    const newMsg: ChatMessage = {
      id: uid(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");

    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const clearToday = async () => {
    setMessages([]);
    await AsyncStorage.removeItem(STORAGE_MESSAGES);
    await AsyncStorage.setItem(STORAGE_LAST_DAY, getDayKey(new Date()));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>God ❤️</Text>
          <Pressable onPress={clearToday} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        </View>

        <View style={styles.chatArea}>
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              if (item.type === "day") {
                return (
                  <View style={styles.dayWrap}>
                    <Text style={styles.dayText}>{item.title}</Text>
                  </View>
                );
              }

              // You -> God: your bubbles on the right
              return (
                <View style={styles.bubbleRowRight}>
                  <View style={styles.bubbleRight}>
                    <Text style={styles.msgText}>{item.msg.text}</Text>
                    <Text style={styles.timeText}>
                      {new Date(item.msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write to God…"
            placeholderTextColor="#8a8a8a"
            style={styles.input}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable onPress={send} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0f" },
  container: { flex: 1, backgroundColor: "#0b0b0f" },

header: {
  height: 70,        
  paddingTop: 12,   
  justifyContent: "center",
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "#23232b",
  paddingHorizontal: 16,
},

headerTitle: {
    top: 30,
  position: "absolute",
  left: 0,
  right: 0,
  textAlign: "center",
  color: "white",
  fontSize: 18,
  fontWeight: "800",
},

clearBtn: {
  alignSelf: "flex-end",
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#2d2d3a",
},
  clearBtnText: { color: "#cfcfe8", fontSize: 12 },

  chatArea: { flex: 1 },

  listContent: {
    padding: 14,
    paddingBottom: 14,
  },

  dayWrap: { alignItems: "center", marginVertical: 10 },
  dayText: {
    color: "#b9b9c9",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#14141b",
    borderWidth: 1,
    borderColor: "#23232b",
  },

  bubbleRowRight: { marginBottom: 10, alignItems: "flex-end" },
  bubbleRight: {
    maxWidth: "88%",
    backgroundColor: "#2a2a3a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#3a3a52",
  },
  msgText: { color: "white", fontSize: 15, lineHeight: 20 },
  timeText: { color: "#b8b8cc", fontSize: 11, marginTop: 6, alignSelf: "flex-end" },

  inputBar: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#23232b",
    backgroundColor: "#0b0b0f",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#14141b",
    borderWidth: 1,
    borderColor: "#23232b",
  },
  sendBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#1f1f2b",
    borderWidth: 1,
    borderColor: "#2d2d3a",
  },
  sendBtnText: { color: "white", fontWeight: "800" },
});
