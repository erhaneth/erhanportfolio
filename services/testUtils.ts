// Test utilities for simulating live session locally
// Run these from browser console to test without Slack

import { ref, set, push } from "firebase/database";
import { database } from "./firebaseService";
import { getSessionId } from "./slackService";

// Get the current session ID
export const getTestSessionId = (): string => {
  const sessionId = getSessionId();
  console.log("📍 Current Session ID:", sessionId);
  return sessionId;
};

// Simulate operator joining the chat
export const simulateOperatorJoin = async (): Promise<void> => {
  const sessionId = getSessionId();
  console.log(`🚀 Simulating operator join for session: ${sessionId}`);

  // Set session to live mode
  const liveRef = ref(database, `sessions/${sessionId}/live`);
  await set(liveRef, {
    isLive: true,
    operatorJoinedAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Send a greeting message
  const messagesRef = ref(database, `messages/${sessionId}`);
  await push(messagesRef, {
    sessionId,
    role: "operator",
    content:
      "Hey! I saw you were interested in chatting. I'm Erhan - how can I help?",
    timestamp: Date.now(),
  });

  console.log("✅ Operator joined! Check the chat UI.");
};

// Simulate operator leaving
export const simulateOperatorLeave = async (): Promise<void> => {
  const sessionId = getSessionId();
  console.log(`👋 Simulating operator leave for session: ${sessionId}`);

  const liveRef = ref(database, `sessions/${sessionId}/live`);
  await set(liveRef, {
    isLive: false,
    operatorJoinedAt: null,
    updatedAt: Date.now(),
  });

  console.log("✅ Operator left. Back to AI mode.");
};

// Simulate operator sending a message
export const simulateOperatorMessage = async (
  message: string
): Promise<void> => {
  const sessionId = getSessionId();
  console.log(`💬 Sending operator message to session: ${sessionId}`);

  const messagesRef = ref(database, `messages/${sessionId}`);
  await push(messagesRef, {
    sessionId,
    role: "operator",
    content: message,
    timestamp: Date.now(),
  });

  console.log("✅ Message sent!");
};

// Expose to window for console access
if (typeof window !== "undefined") {
  (window as any).liveTest = {
    getSessionId: getTestSessionId,
    join: simulateOperatorJoin,
    leave: simulateOperatorLeave,
    send: simulateOperatorMessage,
  };

  console.log(`
🧪 Live Session Test Utilities Loaded!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands (run in browser console):

  liveTest.getSessionId()     → Shows your current session ID
  liveTest.join()             → Simulate Erhan joining the chat
  liveTest.leave()            → Simulate Erhan leaving
  liveTest.send("Hello!")     → Send a message as Erhan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}
