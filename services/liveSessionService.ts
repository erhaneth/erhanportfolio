// Live Session Service
// Handles the live chat mode when Erhan joins the conversation

import {
  ref,
  onValue,
  off,
  set,
  push,
  serverTimestamp,
} from "firebase/database";
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

// Subscribe to live session state changes
export const subscribeToLiveSession = (
  sessionId: string,
  onLiveChange: (isLive: boolean, joinedAt: number | null) => void
): (() => void) => {
  const sessionRef = ref(database, `sessions/${sessionId}/live`);

  const unsubscribe = onValue(sessionRef, (snapshot) => {
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
  let lastProcessedTimestamp = Date.now();

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    snapshot.forEach((child) => {
      const msg = child.val();
      // Only process new operator messages
      if (msg.role === "operator" && msg.timestamp > lastProcessedTimestamp) {
        onMessage({
          id: child.key || `${msg.timestamp}`,
          content: msg.content,
          timestamp: msg.timestamp,
        });
        lastProcessedTimestamp = msg.timestamp;
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
  const historyText = conversationHistory
    .slice(-8)
    .map(
      (m) =>
        `${m.role === "user" ? "👤" : "🤖"} ${m.content.substring(0, 150)}${
          m.content.length > 150 ? "..." : ""
        }`
    )
    .join("\n");

  const payload = {
    text: `🔥 Hot Lead Detected - Session ${sessionId}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔥 Hot Lead Detected",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Session:*\n\`${sessionId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🎯 Intent Summary:*\n${intentSummary}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📊 Signals Detected:*\n${signals
            .map((s) => `• ${s}`)
            .join("\n")}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💬 Conversation:*\n\`\`\`${historyText}\`\`\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `👻 *Ghost Mode:* You can observe silently. Type \`/join ${sessionId}\` to join the chat.`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🚀 Join Chat",
              emoji: true,
            },
            style: "primary",
            action_id: `join_chat_${sessionId}`,
            value: sessionId,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔗 Open Portfolio",
              emoji: true,
            },
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://erhan.ai",
            action_id: "open_portfolio",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch("/.netlify/functions/slack-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("[LiveSession] Failed to notify Slack:", error);
    return false;
  }
};
