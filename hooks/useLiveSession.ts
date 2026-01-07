// Live Session Hook
// Manages the live chat state and operator message subscription

import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeToLiveSession,
  subscribeToOperatorMessages,
  subscribeToOperatorTyping,
  sendVisitorMessage,
  notifyHotLead,
  getCurrentSessionId,
  OperatorMessage,
} from "../services/liveSessionService";

interface UseLiveSessionReturn {
  isLiveMode: boolean;
  operatorJoinedAt: number | null;
  sessionId: string;
  isOperatorTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  checkAndNotify: (messages: { role: string; content: string }[]) => Promise<void>;
}

export const useLiveSession = (
  onOperatorMessage: (message: string) => void,
  onOperatorJoined: () => void
): UseLiveSessionReturn => {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [operatorJoinedAt, setOperatorJoinedAt] = useState<number | null>(null);
  const [isOperatorTyping, setIsOperatorTyping] = useState(false);
  const [sessionId] = useState(getCurrentSessionId);
  const hasNotifiedJoin = useRef(false);
  const hasNotifiedSlack = useRef(false);

  // Subscribe to live session state
  useEffect(() => {
    const unsubscribe = subscribeToLiveSession(
      sessionId,
      (isLive, joinedAt) => {
        const wasLive = isLiveMode;
        setIsLiveMode(isLive);
        setOperatorJoinedAt(joinedAt);

        // Notify once when operator joins
        if (isLive && !wasLive && !hasNotifiedJoin.current) {
          hasNotifiedJoin.current = true;
          onOperatorJoined();
        }
      }
    );

    return unsubscribe;
  }, [sessionId, isLiveMode, onOperatorJoined]);

  // Subscribe to operator messages when in live mode
  useEffect(() => {
    if (!isLiveMode) return;

    const unsubscribe = subscribeToOperatorMessages(
      sessionId,
      (message: OperatorMessage) => {
        onOperatorMessage(message.content);
      }
    );

    return unsubscribe;
  }, [sessionId, isLiveMode, onOperatorMessage]);

  // Subscribe to operator typing status when in live mode
  useEffect(() => {
    if (!isLiveMode) return;

    const unsubscribe = subscribeToOperatorTyping(sessionId, setIsOperatorTyping);

    return unsubscribe;
  }, [sessionId, isLiveMode]);

  // Send message to Firebase for operator
  const sendMessage = useCallback(
    async (content: string) => {
      await sendVisitorMessage(sessionId, content);
    },
    [sessionId]
  );

  // Check message count and notify Slack after 2 user messages
  const checkAndNotify = useCallback(
    async (messages: { role: string; content: string }[]) => {
      const userMsgCount = messages.filter((m) => m.role === "user").length;

      // Notify Slack after exactly 2 user messages (first check only)
      if (userMsgCount === 2 && !hasNotifiedSlack.current) {
        hasNotifiedSlack.current = true;
        console.log("[LiveSession] 2 messages detected, notifying Slack");

        try {
          // Get last few messages for context
          const recentMessages = messages.slice(-5);
          const summary = recentMessages
            .filter((m) => m.role === "user")
            .map((m) => m.content)
            .join(" ");

          await notifyHotLead(
            sessionId,
            messages,
            `User interested in chatting`,
            [summary.substring(0, 80)]
          );
        } catch (error) {
          console.error("[LiveSession] Failed to notify Slack:", error);
        }
      }
    },
    [sessionId]
  );

  return {
    isLiveMode,
    operatorJoinedAt,
    sessionId,
    isOperatorTyping,
    sendMessage,
    checkAndNotify,
  };
};
