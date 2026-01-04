import React, { useEffect, useState, useRef } from "react";

// Voice states
type VoiceState =
  | "inactive"
  | "connecting"
  | "waiting"
  | "listening"
  | "ai-speaking";

interface VoiceButtonProps {
  isActive: boolean;
  isConnecting?: boolean;
  onClick: () => void;
  onStop?: () => void;
  userVolume?: number;
  aiVolume?: number;
  isAiTalking?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isActive,
  isConnecting = false,
  onClick,
  onStop,
  userVolume = 0,
  aiVolume = 0,
  isAiTalking = false,
}) => {
  const [bars, setBars] = useState<number[]>(
    Array(12)
      .fill(0)
      .map((_, i) => 4 + Math.sin(i * 0.5) * 4)
  );
  const [connectionProgress, setConnectionProgress] = useState(0);
  const connectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Determine current state
  const getVoiceState = (): VoiceState => {
    if (!isActive && !isConnecting) return "inactive";
    if (isConnecting) return "connecting";
    if (isAiTalking && aiVolume > 0.02) return "ai-speaking";
    if (userVolume > 0.05) return "listening";
    return "waiting";
  };

  const voiceState = getVoiceState();
  const isExpanded = voiceState !== "inactive";

  // Connection progress animation
  useEffect(() => {
    if (voiceState === "connecting") {
      setConnectionProgress(0);
      connectionIntervalRef.current = setInterval(() => {
        setConnectionProgress((prev) => {
          if (prev >= 100) {
            if (connectionIntervalRef.current)
              clearInterval(connectionIntervalRef.current);
            return 100;
          }
          return prev + Math.random() * 15 + 5;
        });
      }, 100);
    } else {
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
        connectionIntervalRef.current = null;
      }
      setConnectionProgress(0);
    }
    return () => {
      if (connectionIntervalRef.current)
        clearInterval(connectionIntervalRef.current);
    };
  }, [voiceState]);

  // Update bars based on audio state
  useEffect(() => {
    if (voiceState === "inactive") {
      setBars(
        Array(12)
          .fill(0)
          .map((_, i) => {
            const center = 5.5;
            const distance = Math.abs(i - center);
            return 4 + Math.cos(distance * 0.4) * 8;
          })
      );
      return;
    }

    const interval = setInterval(() => {
      const newBars = Array(12)
        .fill(0)
        .map((_, i) => {
          const center = 5.5;
          const distance = Math.abs(i - center);
          const phase = Date.now() * 0.01 + i * 0.5;

          switch (voiceState) {
            case "connecting":
              return (
                4 +
                Math.sin(phase - distance * 0.3) *
                  6 *
                  (connectionProgress / 100)
              );

            case "waiting":
              return 4 + Math.sin(phase * 0.5) * 4 * (1 - distance * 0.08);

            case "listening":
              const userIntensity = Math.max(
                0.3,
                Math.min(userVolume * 2, 1.5)
              );
              return (
                4 + Math.random() * 20 * userIntensity * (1 - distance * 0.03)
              );

            case "ai-speaking":
              const aiIntensity = Math.max(0.4, Math.min(aiVolume * 2.5, 1.8));
              return (
                4 +
                Math.sin(phase * 2 + i * 0.8) * 12 * aiIntensity +
                Math.random() * 10 * aiIntensity
              );

            default:
              return 8;
          }
        });
      setBars(newBars);
    }, 50);

    return () => clearInterval(interval);
  }, [voiceState, userVolume, aiVolume, connectionProgress]);

  // Get state label
  const getLabel = () => {
    switch (voiceState) {
      case "inactive":
        return "SPEAK";
      case "connecting":
        return "CONNECTING...";
      case "waiting":
        return "LISTENING...";
      case "listening":
        return "LISTENING...";
      case "ai-speaking":
        return "AI RESPONDING";
    }
  };

  // Get dynamic glow based on volume
  const getGlowIntensity = () => {
    if (!isExpanded) return 0;
    if (voiceState === "ai-speaking") return 0.5 + aiVolume * 0.5;
    if (voiceState === "listening") return 0.4 + userVolume * 0.6;
    return 0.3;
  };

  const isAiMode = voiceState === "ai-speaking";
  const barColor = isAiMode ? "#0d0208" : "#00FF41";
  const glowIntensity = getGlowIntensity();

  // Inactive state - compact button
  if (!isExpanded) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onClick();
        }}
        className="relative flex items-center gap-2 px-3 py-2 border border-[#003B00] hover:border-[#00FF41] 
                   text-[#00FF41] font-bold transition-all duration-200 touch-manipulation
                   hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]"
        style={{ WebkitTapHighlightColor: "transparent" }}
        type="button"
      >
        {/* Mini waveform */}
        <div className="flex items-center gap-[2px] h-4">
          {bars.slice(4, 8).map((height, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-[#00FF41] opacity-70"
              style={{ height: `${Math.min(Math.max(height * 0.6, 3), 16)}px` }}
            />
          ))}
        </div>
        <span className="text-[10px] tracking-wider uppercase">SPEAK</span>
      </button>
    );
  }

  // Active state - full width inline
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`
        relative flex-1 flex items-center gap-3 px-3 py-2 border-2 font-bold
        transition-all duration-300 ease-out touch-manipulation
        ${
          isAiMode
            ? "bg-[#00FF41] text-[#0d0208] border-[#00FF41]"
            : "bg-[#003B00]/40 text-[#00FF41] border-[#00FF41]"
        }
      `}
      style={{
        WebkitTapHighlightColor: "transparent",
        boxShadow:
          glowIntensity > 0
            ? `0 0 ${25 * glowIntensity}px rgba(0, 255, 65, ${glowIntensity})`
            : "none",
      }}
      type="button"
    >
      {/* LIVE indicator */}
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold ${
          isAiMode
            ? "bg-[#0d0208] text-[#00FF41]"
            : "bg-[#0d0208] text-[#00FF41] border border-[#00FF41]"
        }`}
      >
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        LIVE
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-[2px] h-6 flex-shrink-0">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: `${Math.min(Math.max(height, 3), 24)}px`,
              backgroundColor: barColor,
            }}
          />
        ))}
      </div>

      {/* State label */}
      <span className="flex-1 text-xs tracking-widest uppercase font-bold text-left">
        {getLabel()}
      </span>

      {/* Close button */}
      {onStop && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStop();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStop();
          }}
          className={`flex items-center justify-center w-7 h-7 border transition-all hover:scale-110 cursor-pointer ${
            isAiMode
              ? "border-[#0d0208] text-[#0d0208] hover:bg-[#0d0208] hover:text-[#00FF41]"
              : "border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#0d0208]"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}

      {/* Connection progress bar */}
      {voiceState === "connecting" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003B00]">
          <div
            className="h-full bg-[#00FF41] transition-all duration-100"
            style={{ width: `${Math.min(connectionProgress, 100)}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default VoiceButton;
