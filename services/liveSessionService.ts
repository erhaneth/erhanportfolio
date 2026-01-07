// Live Session Service
// Handles the live chat mode when Erhan joins the conversation

import { ref, onValue, off, set, get, update } from "firebase/database";
import { database, storeMessage } from "./firebaseService";
import { getSessionId } from "./slackService";

export interface LiveSession {
  sessionId: string;
  isLive: boolean;
  operatorJoinedAt: number | null;
  lastActivity: number;
}

export interface OperatorMessage {
  id: string;
  content: string;
  timestamp: number;
}

// Track processed message IDs to avoid duplicates
const processedMessageIds = new Set<string>();

// Subscribe to live session state changes
export const subscribeToLiveSession = (
  sessionId: string,
  onLiveChange: (isLive: boolean, joinedAt: number | null) => void
): (() => void) => {
  const sessionRef = ref(database, `sessions/${sessionId}/live`);

  onValue(sessionRef, (snapshot) => {
    const liveData = snapshot.val();
    if (liveData) {
      onLiveChange(liveData.isLive === true, liveData.operatorJoinedAt || null);
    } else {
      onLiveChange(false, null);
    }
  });

  return () => off(sessionRef);
};

// Subscribe to operator messages
export const subscribeToOperatorMessages = (
  sessionId: string,
  onMessage: (message: OperatorMessage) => void
): (() => void) => {
  const messagesRef = ref(database, `messages/${sessionId}`);

  onValue(messagesRef, (snapshot) => {
    snapshot.forEach((child) => {
      const msg = child.val();
      const msgId = child.key || `${msg.timestamp}`;

      // Only process operator messages we haven't seen before
      if (msg.role === "operator" && !processedMessageIds.has(msgId)) {
        processedMessageIds.add(msgId);
        onMessage({
          id: msgId,
          content: msg.content,
          timestamp: msg.timestamp,
        });
      }
    });
  });

  return () => off(messagesRef);
};

// Mark session as live (called when operator joins via Slack)
export const setSessionLive = async (
  sessionId: string,
  isLive: boolean
): Promise<void> => {
  const sessionRef = ref(database, `sessions/${sessionId}/live`);
  await set(sessionRef, {
    isLive,
    operatorJoinedAt: isLive ? Date.now() : null,
    updatedAt: Date.now(),
  });
};

// Set operator typing status
export const setOperatorTyping = async (
  sessionId: string,
  isTyping: boolean
): Promise<void> => {
  const typingRef = ref(database, `sessions/${sessionId}/typing`);
  await set(typingRef, {
    isTyping,
    updatedAt: Date.now(),
  });
};

// Subscribe to operator typing status
export const subscribeToOperatorTyping = (
  sessionId: string,
  onTypingChange: (isTyping: boolean) => void
): (() => void) => {
  const typingRef = ref(database, `sessions/${sessionId}/typing`);

  onValue(typingRef, (snapshot) => {
    const data = snapshot.val();
    // Only show typing if updated within last 3 seconds
    if (data && data.isTyping && Date.now() - data.updatedAt < 3000) {
      onTypingChange(true);
    } else {
      onTypingChange(false);
    }
  });

  return () => off(typingRef);
};

// Send operator message to Firebase (from admin dashboard)
export const sendOperatorMessage = async (
  sessionId: string,
  content: string
): Promise<void> => {
  await storeMessage(sessionId, "operator", content);
  // Clear typing indicator after sending
  await setOperatorTyping(sessionId, false);
};

// Send visitor message to Firebase (for operator to see)
export const sendVisitorMessage = async (
  sessionId: string,
  content: string
): Promise<void> => {
  await storeMessage(sessionId, "visitor", content);
};

// Get current session ID (or create one)
export const getCurrentSessionId = (): string => {
  return getSessionId();
};

// Notify Slack about hot lead with rich context
export const notifyHotLead = async (
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  intentSummary: string,
  signals: string[]
): Promise<boolean> => {
  // Create or update session in Firebase (use update to avoid overwriting existing session)
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const now = Date.now();
  const existingSession = await get(sessionRef);

  if (existingSession.exists()) {
    // Update existing session without overwriting operatorMode
    await update(sessionRef, {
      lastActivity: now,
      context: intentSummary,
    });
  } else {
    // Create new session
    await set(sessionRef, {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      operatorMode: false,
      context: intentSummary,
    });
  }

  // Store recent conversation history in Firebase
  for (const msg of conversationHistory.slice(-5)) {
    await storeMessage(
      sessionId,
      msg.role === "user" ? "visitor" : "ai",
      msg.content
    );
  }

  const historyText = conversationHistory
    .slice(-5)
    .map(
      (m) =>
        `${m.role === "user" ? "👤" : "🤖"} ${m.content.substring(0, 100)}${
          m.content.length > 100 ? "..." : ""
        }`
    )
    .join("\n");

  // Use simple text format for maximum compatibility with Slack webhooks
  const payload = {
    text: `🔥 *Hot Lead Detected*\n\n*Session:* \`${sessionId}\`\n*Time:* ${new Date().toLocaleString()}\n\n*Intent:* ${intentSummary}\n*Signals:* ${signals
      .slice(0, 3)
      .join(
        ", "
      )}\n\n*Conversation:*\n${historyText}\n\n_Reply with_ \`/join ${sessionId}\` _to join or_ \`[${sessionId}] message\` _to send_`,
  };

  try {
    const response = await fetch("/.netlify/functions/slack-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("[LiveSession] Slack webhook failed:", response.status);
    }

    return response.ok;
  } catch (error) {
    console.error("[LiveSession] Failed to notify Slack:", error);
    return false;
  }
};
