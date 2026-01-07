// Firebase Realtime Database for two-way chat
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  query,
  orderByChild,
  limitToLast,
  off,
  serverTimestamp,
  set,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "portfolio-chat-aab82.firebaseapp.com",
  databaseURL: "https://portfolio-chat-aab82-default-rtdb.firebaseio.com",
  projectId: "portfolio-chat-aab82",
  storageBucket: "portfolio-chat-aab82.firebasestorage.app",
  messagingSenderId: "198858765858",
  appId: "1:198858765858:web:43ceafead0797957627c7b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface ChatMessage {
  id?: string;
  sessionId: string;
  role: "visitor" | "ai" | "operator";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  createdAt: number;
  lastActivity: number;
  operatorMode: boolean;
  context?: string;
}

// Create or update a chat session
export const createOrUpdateSession = async (
  sessionId: string,
  operatorMode: boolean,
  context?: string
): Promise<void> => {
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const now = Date.now();

  await set(sessionRef, {
    id: sessionId,
    createdAt: now,
    lastActivity: now,
    operatorMode,
    context: context || null,
  });
};

// Store a message in Firebase
export const storeMessage = async (
  sessionId: string,
  role: "visitor" | "ai" | "operator",
  content: string
): Promise<string | null> => {
  try {
    const messagesRef = ref(database, `messages/${sessionId}`);
    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      sessionId,
      role,
      content,
      timestamp: Date.now(),
    });

    // Update session last activity
    const sessionRef = ref(database, `sessions/${sessionId}/lastActivity`);
    await set(sessionRef, Date.now());

    return newMessageRef.key;
  } catch (error) {
    console.error("Failed to store message:", error);
    return null;
  }
};

// Subscribe to messages for a session (for real-time updates)
export const subscribeToMessages = (
  sessionId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = ref(database, `messages/${sessionId}`);
  const messagesQuery = query(
    messagesRef,
    orderByChild("timestamp"),
    limitToLast(100)
  );

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((child) => {
      messages.push({
        id: child.key || undefined,
        ...child.val(),
      });
    });
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(messages);
  });

  // Return cleanup function
  return () => off(messagesRef);
};

// Subscribe to operator messages only (for visitor to see operator replies)
export const subscribeToOperatorMessages = (
  sessionId: string,
  callback: (message: ChatMessage) => void
): (() => void) => {
  const messagesRef = ref(database, `messages/${sessionId}`);

  let lastTimestamp = Date.now();

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    snapshot.forEach((child) => {
      const msg = child.val();
      // Only trigger for new operator messages
      if (msg.role === "operator" && msg.timestamp > lastTimestamp) {
        callback({
          id: child.key || undefined,
          ...msg,
        });
        lastTimestamp = msg.timestamp;
      }
    });
  });

  return () => off(messagesRef);
};

// Check if there are new operator messages since a timestamp
export const checkForOperatorMessages = async (
  sessionId: string,
  sinceTimestamp: number
): Promise<ChatMessage[]> => {
  return new Promise((resolve) => {
    const messagesRef = ref(database, `messages/${sessionId}`);

    onValue(
      messagesRef,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((child) => {
          const msg = child.val();
          if (msg.role === "operator" && msg.timestamp > sinceTimestamp) {
            messages.push({
              id: child.key || undefined,
              ...msg,
            });
          }
        });
        resolve(messages);
      },
      { onlyOnce: true }
    );
  });
};

export { database };
