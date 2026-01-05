// Live Session Hook
// Manages the live chat state and operator message subscription

import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeToLiveSession,
  subscribeToOperatorMessages,
  sendVisitorMessage,
  notifyHotLead,
  getCurrentSessionId,
  OperatorMessage,
} from "../services/liveSessionService";
import {
  analyzeIntent,
  shouldNotifySlack,
  markSessionNotified,
} from "../services/intentService";

interface UseLiveSessionReturn {
  isLiveMode: boolean;
  operatorJoinedAt: number | null;
  sessionId: string;
  sendMessage: (content: string) => Promise<void>;
  checkIntent: (messages: { role: string; content: string }[]) => Promise<void>;
}

export const useLiveSession = (
  onOperatorMessage: (message: string) => void,
  onOperatorJoined: () => void
): UseLiveSessionReturn => {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [operatorJoinedAt, setOperatorJoinedAt] = useState<number | null>(null);
  const [sessionId] = useState(getCurrentSessionId);
  const hasNotifiedJoin = useRef(false);
  const lastAnalyzedLength = useRef(0);

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

  // Send message to Firebase for operator
  const sendMessage = useCallback(
    async (content: string) => {
      await sendVisitorMessage(sessionId, content);
    },
    [sessionId]
  );

  // Check intent and notify Slack if hot lead
  const checkIntent = useCallback(
    async (messages: { role: string; content: string }[]) => {
      // Only analyze every 3 messages to save API calls
      const userMsgCount = messages.filter((m) => m.role === "user").length;
      if (userMsgCount < lastAnalyzedLength.current || userMsgCount % 3 !== 0) {
        return;
      }
      lastAnalyzedLength.current = userMsgCount;

      try {
        const analysis = await analyzeIntent(messages);

        // Check if we should notify Slack
        if (shouldNotifySlack(sessionId, analysis.intent)) {
          console.log("[LiveSession] Hot lead detected, notifying Slack");
          await notifyHotLead(
            sessionId,
            messages,
            analysis.summary,
            analysis.signals
          );
          markSessionNotified(sessionId);
        }
      } catch (error) {
        console.error("[LiveSession] Intent check failed:", error);
      }
    },
    [sessionId]
  );

  return {
    isLiveMode,
    operatorJoinedAt,
    sessionId,
    sendMessage,
    checkIntent,
  };
};
