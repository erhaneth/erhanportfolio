import React, { useState, useEffect } from "react";

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [dots, setDots] = useState("");

  const stages = [
    { text: "INITIALIZING ZION_MAINFRAME", delay: 400 },
    { text: "LOADING NEURAL_INTERFACE", delay: 500, status: "✓" },
    { text: "VOICE_RECOGNITION", delay: 600, status: "✓" },
    { text: "AI_ASSISTANT", delay: 500, status: "✓" },
    { text: "REAL_TIME_OPERATOR", delay: 600, status: "✓" },
    { text: "MISSION_ANALYSIS", delay: 500, status: "✓" },
    { text: "HIDDEN_PROTOCOLS", delay: 700, status: "?" },
  ];

  // Animated dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Progress through stages
  useEffect(() => {
    if (stage < stages.length) {
      const timer = setTimeout(() => {
        setStage((prev) => prev + 1);
      }, stages[stage].delay);
      return () => clearTimeout(timer);
    } else {
      // Final stage - wait a bit then show "ready" message
      const finalTimer = setTimeout(() => {
        setStage(stages.length + 1); // Trigger ready state
      }, 800);
      return () => clearTimeout(finalTimer);
    }
  }, [stage]);

  // Auto-dismiss after showing "SYSTEM_READY"
  useEffect(() => {
    if (stage === stages.length + 1) {
      const dismissTimer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(dismissTimer);
    }
  }, [stage, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#0d0208] flex items-center justify-center cursor-pointer"
      onClick={() => {
        if (stage === stages.length + 1) {
          onComplete();
        }
      }}
    >
      {/* Matrix rain background - subtle */}
      <div className="absolute inset-0 opacity-20">
        <div className="matrix-rain-overlay" />
      </div>

      {/* Boot sequence content */}
      <div className="relative z-10 max-w-2xl w-full px-6 mono">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[#00FF41] text-xl sm:text-2xl font-bold tracking-wider animate-pulse">
            [ ZION MAINFRAME ]
          </div>
          <div className="text-[#008F11] text-xs mt-2">
            v2.5.0 - NEURAL INTERFACE PROTOCOL
          </div>
        </div>

        {/* Loading stages */}
        <div className="space-y-3 mb-8">
          {stages.map((s, i) => {
            if (i > stage) return null;
            const isLoading = i === stage && stage < stages.length;
            const isComplete = i < stage;

            return (
              <div
                key={i}
                className="flex items-center gap-3 text-sm sm:text-base"
              >
                <span className="text-[#008F11] w-6">
                  [{isComplete ? s.status : isLoading ? "..." : " "}]
                </span>
                <span
                  className={`flex-1 ${
                    isComplete
                      ? "text-[#00FF41]"
                      : isLoading
                      ? "text-[#00FF41] animate-pulse"
                      : "text-[#003B00]"
                  }`}
                >
                  {s.text}
                  {isLoading && (
                    <span className="inline-block w-8">{dots}</span>
                  )}
                </span>
                {isComplete && (
                  <span
                    className={`text-lg ${
                      s.status === "?"
                        ? "text-[#FFD700] animate-pulse"
                        : "text-[#00FF41]"
                    }`}
                  >
                    {s.status}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* System ready message */}
        {stage === stages.length + 1 && (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="text-[#00FF41] text-xl sm:text-2xl font-bold tracking-wider animate-pulse">
              [ SYSTEM_READY ]
            </div>
            <div className="text-[#008F11] text-xs sm:text-sm">
              Click anywhere to enter &gt;&gt;
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-8 w-full bg-[#003B00]/50 h-1">
          <div
            className="h-full bg-[#00FF41] transition-all duration-300 shadow-[0_0_10px_rgba(0,255,65,0.5)]"
            style={{
              width: `${Math.min(
                ((stage + 1) / (stages.length + 1)) * 100,
                100
              )}%`,
            }}
          />
        </div>

        {/* Skip hint - only show before ready */}
        {stage < stages.length + 1 && (
          <div className="text-center mt-6 text-[#003B00] text-xs hover:text-[#008F11] transition-colors">
            Click to skip
          </div>
        )}
      </div>
    </div>
  );
};

export default BootSequence;
