import React, { useEffect } from "react";

interface HelpPanelProps {
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-terminal border-2 border-[#00FF41] p-6 w-full max-w-2xl mx-4 shadow-[0_0_50px_rgba(0,255,65,0.4)] mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[#003B00] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00FF41] animate-pulse" />
            <h2 className="text-lg font-bold text-[#00FF41] uppercase tracking-wider">
              [ SYSTEM_COMMANDS ]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#008F11] hover:text-[#00FF41] transition-colors text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Main Features */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-[#008F11] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-[#00FF41]" />
              Main Features
            </h3>
            <div className="space-y-2 text-sm text-[#00FF41]">
              <div className="flex gap-3 items-start">
                <span className="text-[#008F11]">🎤</span>
                <div>
                  <strong className="text-[#00FF41]">Voice Mode:</strong> Click
                  the "SPEAK" button to talk with AI using voice commands
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#008F11]">👤</span>
                <div>
                  <strong className="text-[#00FF41]">Context Mode:</strong>{" "}
                  Click "WHO ARE YOU?" to unlock recruiter/visitor mode with
                  personalized responses
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#008F11]">💼</span>
                <div>
                  <strong className="text-[#00FF41]">Mission Analysis:</strong>{" "}
                  As recruiter, paste job description to get AI-powered fit
                  analysis
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#008F11]">🔴</span>
                <div>
                  <strong className="text-[#00FF41]">Live Operator:</strong>{" "}
                  Erhan can join your session in real-time (when available)
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-[#003B00] pt-4">
            <h3 className="text-xs font-bold text-[#008F11] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-[#00FF41]" />
              Voice Commands
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#00FF41]">
              <div>
                <span className="text-[#008F11]">•</span> "Show me your
                projects"
              </div>
              <div>
                <span className="text-[#008F11]">•</span> "Close it"
              </div>
              <div>
                <span className="text-[#008F11]">•</span> "Send me your resume"
              </div>
              <div>
                <span className="text-[#008F11]">•</span> "Show GitHub stats"
              </div>
              <div>
                <span className="text-[#008F11]">•</span> "Tell me about
                [project]"
              </div>
              <div>
                <span className="text-[#008F11]">•</span> "Switch language"
              </div>
            </div>
          </section>

          <section className="border-t border-[#003B00] pt-4">
            <h3 className="text-xs font-bold text-[#008F11] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-[#00FF41]" />
              Text Commands
            </h3>
            <div className="space-y-2 text-xs text-[#00FF41]">
              <div className="flex gap-3">
                <code className="text-[#008F11] bg-[#003B00] px-2 py-1">
                  /help
                </code>
                <span>Show this help panel</span>
              </div>
              <div className="flex gap-3">
                <code className="text-[#008F11] bg-[#003B00] px-2 py-1">
                  /clear
                </code>
                <span>Clear conversation (refresh page)</span>
              </div>
            </div>
          </section>

          <section className="border-t border-[#003B00] pt-4">
            <h3 className="text-xs font-bold text-[#FFD700] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-3 bg-[#FFD700] animate-pulse" />
              Easter Eggs
            </h3>
            <div className="text-xs text-[#008F11] italic">
              <span className="text-[#FFD700]">?</span> Hidden features exist...
              explore to discover them.
              <br />
              <span className="text-[#FFD700]">?</span> Try asking unusual
              questions.
              <br />
              <span className="text-[#FFD700]">?</span> Some secrets are deeply
              hidden...
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#003B00] text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#00FF41] text-[#0d0208] text-xs font-bold hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all uppercase tracking-wider"
          >
            Close [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
