import React, { useEffect, useState, useCallback } from "react";

interface LanguageActivationProps {
  isActive: boolean;
  language: "en" | "tr";
  onClose: () => void;
}

// Futuristic cascading UI effect - no popup, just visual feedback
const LanguageActivation: React.FC<LanguageActivationProps> = ({
  isActive,
  language,
  onClose,
}) => {
  const [phase, setPhase] = useState<
    "idle" | "detecting" | "switching" | "complete"
  >("idle");
  const [glitchText, setGlitchText] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  // Glitch text effect
  const generateGlitch = useCallback(() => {
    const chars = "ÇŞĞİÖÜ01ABCDEF_<>[]{}";
    return Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }, []);

  useEffect(() => {
    if (isActive && language === "tr") {
      // Phase 1: Detection scan
      setPhase("detecting");
      setScanProgress(0);

      const scanInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 8, 100));
        setGlitchText(generateGlitch());
      }, 50);

      // Phase 2: Switch after scan
      const switchTimer = setTimeout(() => {
        clearInterval(scanInterval);
        setPhase("switching");
        setScanProgress(100);
      }, 600);

      // Phase 3: Complete
      const completeTimer = setTimeout(() => {
        setPhase("complete");
      }, 1200);

      // Phase 4: Cleanup
      const cleanupTimer = setTimeout(() => {
        setPhase("idle");
        onClose();
      }, 2000);

      return () => {
        clearInterval(scanInterval);
        clearTimeout(switchTimer);
        clearTimeout(completeTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [isActive, language, onClose, generateGlitch]);

  if (phase === "idle") return null;

  return (
    <>
      {/* Full screen cascade effect overlay */}
      <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
        {/* Horizontal scan line */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FF41] to-transparent"
          style={{
            top: `${scanProgress}%`,
            opacity: phase === "detecting" ? 1 : 0,
            transition: "opacity 0.3s",
            boxShadow: "0 0 20px #00FF41, 0 0 40px #00FF41",
          }}
        />

        {/* Vertical cascade lines */}
        {phase !== "idle" && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 w-[1px] bg-gradient-to-b from-[#00FF41] via-[#00FF41]/50 to-transparent"
                style={{
                  left: `${5 + i * 5}%`,
                  height: phase === "complete" ? "100%" : "0%",
                  transition: `height 0.4s ease-out ${i * 0.03}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Corner brackets with glitch effect */}
        <div
          className={`absolute top-4 left-4 transition-all duration-300 ${
            phase !== "idle" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-8 h-8 border-t-2 border-l-2 border-[#00FF41]"
            style={{ boxShadow: "0 0 10px #00FF41" }}
          />
        </div>
        <div
          className={`absolute top-4 right-4 transition-all duration-300 ${
            phase !== "idle" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-8 h-8 border-t-2 border-r-2 border-[#00FF41]"
            style={{ boxShadow: "0 0 10px #00FF41" }}
          />
        </div>
        <div
          className={`absolute bottom-4 left-4 transition-all duration-300 ${
            phase !== "idle" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-8 h-8 border-b-2 border-l-2 border-[#00FF41]"
            style={{ boxShadow: "0 0 10px #00FF41" }}
          />
        </div>
        <div
          className={`absolute bottom-4 right-4 transition-all duration-300 ${
            phase !== "idle" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-8 h-8 border-b-2 border-r-2 border-[#00FF41]"
            style={{ boxShadow: "0 0 10px #00FF41" }}
          />
        </div>
      </div>

      {/* Status indicator - top center */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[61] pointer-events-none">
        <div
          className={`
            px-6 py-3 border border-[#00FF41] bg-[#020202]/95 backdrop-blur-sm
            transition-all duration-300 transform
            ${
              phase !== "idle"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }
          `}
          style={{
            boxShadow:
              "0 0 30px rgba(0, 255, 65, 0.4), inset 0 0 20px rgba(0, 255, 65, 0.1)",
          }}
        >
          {/* Glitch overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-[#00FF41]/5"
              style={{
                animation:
                  phase === "detecting" ? "glitch-bg 0.1s infinite" : "none",
              }}
            />
          </div>

          <div className="relative flex items-center gap-4">
            {/* Status icon */}
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${
                  phase === "complete" ? "bg-[#00FF41]" : "bg-[#00FF41]/50"
                }`}
                style={{
                  boxShadow:
                    phase === "complete"
                      ? "0 0 10px #00FF41, 0 0 20px #00FF41"
                      : "none",
                  animation:
                    phase === "detecting" ? "pulse-fast 0.3s infinite" : "none",
                }}
              />
              {phase === "detecting" && (
                <div className="absolute inset-0 rounded-full border border-[#00FF41] animate-ping" />
              )}
            </div>

            {/* Status text */}
            <div className="text-[#00FF41] font-mono text-xs tracking-widest uppercase">
              {phase === "detecting" && (
                <span className="inline-flex items-center gap-2">
                  <span>DİL_TARAMA</span>
                  <span className="text-[#008F11] font-light">
                    [{glitchText}]
                  </span>
                </span>
              )}
              {phase === "switching" && (
                <span className="animate-pulse">
                  TÜRKÇE_MOD_BAŞLATILIYOR...
                </span>
              )}
              {phase === "complete" && (
                <span className="flex items-center gap-2">
                  <span>✓</span>
                  <span>TÜRKÇE_AKTİF</span>
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-20 h-1 bg-[#003B00] overflow-hidden">
              <div
                className="h-full bg-[#00FF41] transition-all duration-100"
                style={{
                  width: `${scanProgress}%`,
                  boxShadow: "0 0 10px #00FF41",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Screen glitch effect */}
      <style>{`
        @keyframes glitch-bg {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
        }
        
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes cascade-in {
          from { 
            clip-path: inset(0 0 100% 0);
            filter: hue-rotate(90deg);
          }
          to { 
            clip-path: inset(0 0 0% 0);
            filter: hue-rotate(0deg);
          }
        }
      `}</style>
    </>
  );
};

export default LanguageActivation;
