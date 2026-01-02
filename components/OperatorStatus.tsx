import React, { useState, useEffect } from "react";
import {
  notifyOperatorRequest,
  getSessionId,
} from "../services/slackService";
import { subscribeToOperatorMessages, ChatMessage } from "../services/firebaseService";

interface OperatorStatusProps {
  conversationHistory: { role: string; content: string }[];
  userContext?: string;
  isOperatorMode: boolean;
  onOperatorMessage?: (message: string) => void;
  hasOperatorResponded?: boolean; // Show indicator only after operator responds
}

const OperatorStatus: React.FC<OperatorStatusProps> = ({
  conversationHistory,
  userContext,
  isOperatorMode,
  onOperatorMessage,
  hasOperatorResponded = false,
}) => {
  const [sessionId] = useState(getSessionId);

  // Subscribe to operator messages when in operator mode
  useEffect(() => {
    if (!isOperatorMode) return;

    const unsubscribe = subscribeToOperatorMessages(sessionId, (message: ChatMessage) => {
      if (onOperatorMessage && message.content) {
        onOperatorMessage(message.content);
      }
    });

    return () => unsubscribe();
  }, [isOperatorMode, sessionId, onOperatorMessage]);

  // Only show indicator if operator mode is active AND operator has responded
  // This creates the "surprise" effect - they don't know you're there until you respond
  if (!isOperatorMode || !hasOperatorResponded) {
    return null; // Completely invisible until operator responds
  }

  return (
    <div className="glass-terminal border border-[#00FF41]/30 bg-[#00FF41]/5 p-2 transition-all duration-500">
      <div className="flex items-center gap-2">
        {/* Subtle pulsing indicator */}
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-ping opacity-50" />
        </div>
        <span className="text-[9px] text-[#00FF41] uppercase tracking-widest font-bold">
          👤 Erhan is here
        </span>
      </div>
    </div>
  );
};

export default OperatorStatus;
