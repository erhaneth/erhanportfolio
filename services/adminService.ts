// Admin Dashboard Service
// Fetches active sessions and allows operator control

import { ref, get, query, orderByChild, limitToLast } from "firebase/database";
import { database } from "./firebaseService";

export interface SessionInfo {
  sessionId: string;
  messageCount: number;
  lastMessage: string;
  lastMessageTime: number;
  isLive: boolean;
  firstUserMessage: string;
}

// Fetch all active sessions (sessions with messages in last 30 minutes)
export const getActiveSessions = async (): Promise<SessionInfo[]> => {
  try {
    const messagesRef = ref(database, "messages");
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const sessions: SessionInfo[] = [];
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    snapshot.forEach((sessionSnap) => {
      const sessionId = sessionSnap.key;
      if (!sessionId) return;

      const messages: any[] = [];
      let lastMessage = "";
      let lastMessageTime = 0;
      let firstUserMessage = "";

      sessionSnap.forEach((msgSnap) => {
        const msg = msgSnap.val();
        if (msg.timestamp && msg.timestamp > thirtyMinutesAgo) {
          messages.push(msg);
          if (msg.timestamp > lastMessageTime) {
            lastMessage = msg.content?.substring(0, 100) || "...";
            lastMessageTime = msg.timestamp;
          }
          if (msg.role === "user" && !firstUserMessage) {
            firstUserMessage = msg.content?.substring(0, 80) || "";
          }
        }
      });

      if (messages.length > 0) {
        sessions.push({
          sessionId,
          messageCount: messages.length,
          lastMessage,
          lastMessageTime,
          isLive: false, // Will be checked separately
          firstUserMessage,
        });
      }
    });

    // Sort by most recent
    sessions.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    // Check live status for each session
    for (const session of sessions) {
      try {
        const liveRef = ref(database, `sessions/${session.sessionId}/live`);
        const liveSnap = await get(liveRef);
        if (liveSnap.exists()) {
          session.isLive = liveSnap.val().isLive === true;
        }
      } catch (e) {
        // Ignore errors checking live status
      }
    }

    return sessions;
  } catch (error) {
    console.error("[AdminService] Failed to fetch sessions:", error);
    return [];
  }
};

// Get detailed conversation for a session
export const getSessionConversation = async (
  sessionId: string
): Promise<any[]> => {
  try {
    const messagesRef = ref(database, `messages/${sessionId}`);
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const messages: any[] = [];
    snapshot.forEach((msgSnap) => {
      messages.push(msgSnap.val());
    });

    return messages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("[AdminService] Failed to fetch conversation:", error);
    return [];
  }
};

// Subscribe to conversation updates (real-time)
export const subscribeToConversation = (
  sessionId: string,
  onUpdate: (messages: any[]) => void
): (() => void) => {
  const { onValue, off } = require("firebase/database");
  const messagesRef = ref(database, `messages/${sessionId}`);

  const unsubscribe = onValue(messagesRef, (snapshot: any) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const messages: any[] = [];
    snapshot.forEach((msgSnap: any) => {
      messages.push(msgSnap.val());
    });

    onUpdate(messages.sort((a: any, b: any) => a.timestamp - b.timestamp));
  });

  return () => off(messagesRef);
};
