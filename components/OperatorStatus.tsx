import React, { useState, useEffect } from "react";
import { notifyOperatorRequest, getSessionId } from "../services/slackService";
import {
  subscribeToOperatorMessages,
  ChatMessage,
} from "../services/firebaseService";

interface OperatorStatusProps {
  conversationHistory: { role: string; content: string }[];
  userContext?: string;
  onOperatorModeChange: (isActive: boolean) => void;
  onOperatorMessage?: (message: string) => void;
}

const OperatorStatus: React.FC<OperatorStatusProps> = ({
  conversationHistory,
  userContext,
  onOperatorModeChange,
  onOperatorMessage,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const [sessionId] = useState(getSessionId);

  // Simple time-based availability (can be replaced with Firebase/Supabase later)
  const getOperatorStatus = () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 23;
  };

  const [isOnline, setIsOnline] = useState(getOperatorStatus());

  // Update status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(getOperatorStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to operator messages when in operator mode
  useEffect(() => {
    if (!isOperatorMode) return;

    const unsubscribe = subscribeToOperatorMessages(
      sessionId,
      (message: ChatMessage) => {
        if (onOperatorMessage && message.content) {
          onOperatorMessage(message.content);
        }
      }
    );

    return () => unsubscribe();
  }, [isOperatorMode, sessionId, onOperatorMessage]);

  // Show tooltip briefly on first render
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem("operatorTooltipSeen");
    if (!hasSeenTooltip) {
      let hideTimer: NodeJS.Timeout;
      const showTimer = setTimeout(() => {
        setShowTooltip(true);
        hideTimer = setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem("operatorTooltipSeen", "true");
        }, 4000);
      }, 3000);
      return () => {
        clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleConnect = async () => {
    if (isOperatorMode) {
      // Disconnect from operator mode
      setIsOperatorMode(false);
      onOperatorModeChange(false);
      return;
    }

    setIsConnecting(true);

    // Notify Slack
    const success = await notifyOperatorRequest(
      sessionId,
      conversationHistory,
      userContext
    );

    if (success) {
      setIsOperatorMode(true);
      onOperatorModeChange(true);
    }

    setIsConnecting(false);
  };

  return (
    <div className="relative">
      {/* Status Indicator */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          isOperatorMode ? "Disconnect from operator" : "Connect to operator"
        }
        aria-pressed={isOperatorMode}
        className={`glass-terminal border p-3 transition-all duration-300 cursor-pointer group ${
          isOperatorMode
            ? "border-[#00FF41] bg-[#00FF41]/10"
            : "border-[#003B00] hover:border-[#00FF41]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleConnect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleConnect();
          }
        }}
      >
        {/* Main Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Pulsing Status Light */}
            <div className="relative">
              <div
                className={`w-2 h-2 rounded-full ${
                  isOperatorMode
                    ? "bg-[#00FF41]"
                    : isOnline
                    ? "bg-[#00FF41]"
                    : "bg-[#FF4141]"
                }`}
              />
              {(isOnline || isOperatorMode) && (
                <div
                  className={`absolute inset-0 w-2 h-2 rounded-full ${
                    isOperatorMode ? "bg-[#00FF41]" : "bg-[#00FF41]"
                  } animate-ping opacity-75`}
                />
              )}
            </div>
            <span className="text-[10px] text-[#008F11] uppercase tracking-widest font-bold">
              {isOperatorMode ? (
                <>
                  UPLINK: <span className="text-[#00FF41]">ACTIVE</span>
                </>
              ) : (
                <>
                  OPERATOR:{" "}
                  <span
                    className={isOnline ? "text-[#00FF41]" : "text-[#FF4141]"}
                  >
                    {isOnline ? "ONLINE" : "AWAY"}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-1 text-[9px] text-[#003B00] group-hover:text-[#00FF41] transition-colors">
            {isConnecting ? (
              <span className="text-[#00FF41] animate-pulse">
                [ESTABLISHING...]
              </span>
            ) : isOperatorMode ? (
              <span className="text-[#00FF41]">[DISCONNECT]</span>
            ) : (
              <>
                <span className="hidden sm:inline">
                  [{isHovered ? "CONNECT" : "DIRECT_CHANNEL"}]
                </span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </div>
        </div>

        {/* Expanded Info on Hover */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isHovered || isOperatorMode
              ? "max-h-24 opacity-100 mt-2"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 border-t border-[#003B00]">
            {isOperatorMode ? (
              <>
                <p className="text-[9px] text-[#00FF41]">
                  ▸ Erhan has been notified and is monitoring this chat
                </p>
                <p className="text-[9px] text-[#008F11] mt-1">
                  Session: <span className="font-mono">{sessionId}</span>
                </p>
              </>
            ) : (
              <p className="text-[9px] text-[#008F11]">
                {isOnline
                  ? "▸ Request direct connection to Erhan"
                  : "▸ Leave a message, response within 24h"}
              </p>
            )}
            {!isOperatorMode && (
              <div className="flex items-center gap-1 mt-1.5 text-[#00FF41]">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  INITIATE_UPLINK
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* First-time Tooltip */}
      {showTooltip && !isOperatorMode && (
        <div className="absolute -bottom-12 left-0 right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-[#003B00] border border-[#00FF41] p-2 text-[9px] text-[#00FF41] text-center">
            ▲ Click to request direct connection with Erhan
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorStatus;
