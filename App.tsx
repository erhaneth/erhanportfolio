import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Project } from "./types";
import { PORTFOLIO_DATA } from "./constants";
import ChatInterface from "./components/ChatInterface";
import ProjectDisplay from "./components/ProjectDisplay";
import MatrixRain from "./components/MatrixRain";
import EmailModal from "./components/EmailModal";
import LanguageActivation from "./components/LanguageActivation";
import MissionBriefing from "./components/MissionBriefing";
import ContextPills, {
  generateContextFromPills,
} from "./components/ContextPills";
import { useLiveSession } from "./hooks/useLiveSession";
import GitHeatmap from "./components/GitHeatmap";
import { useMessages } from "./hooks/useMessages";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { sendResume } from "./services/emailService";
import { useLanguage } from "./contexts/LanguageContext";

// Lazy load AdminDashboard since it's rarely accessed
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);

// Load test utilities in development only
if (import.meta.env.DEV) {
  import("./services/testUtils");
}

type UserMode = "hiring" | "visiting" | null;

const AppContent: React.FC = () => {
  const {
    language,
    detectAndSetLanguage,
    translate,
    showActivation,
    setShowActivation,
  } = useLanguage();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      if (import.meta.env.DEV) {
        console.log("[App] Network: Online");
      }
    };
    const handleOffline = () => {
      if (import.meta.env.DEV) {
        console.warn("[App] Network: Offline");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingResume, setIsSendingResume] = useState(false);
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const [missionJobDescription, setMissionJobDescription] = useState("");
  const [showGitHeatmap, setShowGitHeatmap] = useState(false);
  const [isClosingProject, setIsClosingProject] = useState(false);
  const [isClosingHeatmap, setIsClosingHeatmap] = useState(false);

  // Handle project switching - reset closing state when new project is set
  const handleProjectShow = useCallback((project: Project) => {
    // Always reset closing state when showing a project (whether switching or first time)
    setIsClosingProject(false);
    setActiveProject(project);
  }, []);

  // Handle AI-triggered close display
  const handleCloseDisplay = useCallback(
    (target: "project" | "heatmap" | "all") => {
      if (target === "project" || target === "all") {
        // Trigger closing animation on mobile
        setIsClosingProject(true);
        setTimeout(() => {
          setActiveProject(null);
          setIsClosingProject(false);
        }, 500);
      }
      if (target === "heatmap" || target === "all") {
        // Trigger closing animation on mobile
        setIsClosingHeatmap(true);
        setTimeout(() => {
          setShowGitHeatmap(false);
          setIsClosingHeatmap(false);
        }, 500);
      }
    },
    []
  );

  // Context pill selections
  const [userMode, setUserMode] = useState<UserMode>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState("");

  // Generate combined context from pills + custom input
  const userContext = useMemo(() => {
    const pillContext = generateContextFromPills(
      userMode,
      selectedRole,
      selectedFocus
    );
    if (pillContext && customContext) {
      return `${pillContext}\n\nAdditional context: ${customContext}`;
    }
    return pillContext || customContext;
  }, [userMode, selectedRole, selectedFocus, customContext]);

  // Messages hook
  const {
    messages,
    isLoading,
    addSystemMessage,
    addOperatorMessage,
    addOperatorJoinedDivider,
    handleSendMessage,
    updateTransientMessage,
    finalizeTransientMessages,
  } = useMessages(
    userContext,
    handleProjectShow,
    () => setShowEmailModal(true),
    () => setShowGitHeatmap(true),
    handleCloseDisplay
  );

  // Live session hook - handles operator joining and messages
  const {
    isLiveMode,
    isOperatorTyping,
    sendMessage: sendToOperator,
    checkAndNotify,
  } = useLiveSession(
    // Handle incoming operator messages
    useCallback(
      (message: string) => {
        addOperatorMessage(message);
      },
      [addOperatorMessage]
    ),
    // Handle operator joined event
    useCallback(() => {
      addOperatorJoinedDivider();
    }, [addOperatorJoinedDivider])
  );

  // Handle resume email sending
  const handleSendResume = useCallback(
    async (email: string, name: string) => {
      setIsSendingResume(true);
      try {
        const result = await sendResume(email, name);
        if (result.success) {
          addSystemMessage(translate("system.resumeSent", { email }));
          setShowEmailModal(false);
        } else {
          addSystemMessage(
            translate("system.error", {
              message:
                result.error ||
                translate("system.error", {
                  message: "Failed to send resume.",
                }),
            })
          );
        }
      } catch (error) {
        addSystemMessage(
          translate("system.error", {
            message: "Failed to send resume. Please try again.",
          })
        );
      } finally {
        setIsSendingResume(false);
      }
    },
    [addSystemMessage]
  );

  // Voice chat hook
  const {
    isVoiceEnabled,
    isConnecting,
    isAiTalking,
    userVolume,
    aiVolume,
    toggleVoice,
    stopVoiceChat,
  } = useVoiceChat({
    userContext,
    onProjectShow: handleProjectShow,
    onInputTranscript: useCallback(
      (text: string) => {
        if (import.meta.env.DEV) {
          console.log("[App] onInputTranscript called with text:", text);
          console.log("[App] Calling detectAndSetLanguage for voice input...");
        }
        detectAndSetLanguage(text);
        updateTransientMessage("user", text);
      },
      [updateTransientMessage, detectAndSetLanguage]
    ),
    onOutputTranscript: useCallback(
      (text: string) => {
        updateTransientMessage("assistant", text);
      },
      [updateTransientMessage]
    ),
    onTurnComplete: useCallback(() => {
      finalizeTransientMessages((updatedMessages) => {
        // Check if we should notify Slack for voice chat
        checkAndNotify(
          updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        );
      });
    }, [finalizeTransientMessages, checkAndNotify]),
    onSystemMessage: addSystemMessage,
    onResumeRequest: () => setShowEmailModal(true),
    onShowGitHeatmap: () => setShowGitHeatmap(true),
    onCloseDisplay: handleCloseDisplay,
  });

  // Handle text message submission
  const onSendMessage = useCallback(
    async (text: string) => {
      if (import.meta.env.DEV) {
        console.log("[App] onSendMessage called with text:", text);
      }
      detectAndSetLanguage(text);

      if (isLiveMode) {
        // In live mode: send to Firebase for operator, skip AI
        await sendToOperator(text);
        await handleSendMessage(text, true); // skipAI = true
      } else {
        // Normal AI mode - notify Slack after 2 messages
        await handleSendMessage(text, false, (updatedMessages) => {
          // Check if we should notify Slack
          checkAndNotify(
            updatedMessages.map((m) => ({ role: m.role, content: m.content }))
          );
        });
      }
    },
    [
      handleSendMessage,
      detectAndSetLanguage,
      isLiveMode,
      sendToOperator,
      checkAndNotify,
    ]
  );

  // Check if any context is set
  const hasContext = userMode || selectedRole || selectedFocus || customContext;

  // Get context label for button
  const getContextLabel = () => {
    if (showContextPanel) return translate("context.hide");
    if (!hasContext) return translate("context.whoAreYou");
    if (userMode === "hiring") return translate("context.recruiterMode");
    if (userMode === "visiting") return translate("context.visitorMode");
    return translate("context.set");
  };

  return (
    <div className="min-h-screen h-screen relative flex flex-col lg:flex-row p-2 sm:p-4 gap-2 sm:gap-4 max-w-screen-2xl mx-auto overflow-x-hidden text-[#00FF41]">
      <MatrixRain />

      <aside className="relative z-20 w-full lg:w-80 lg:h-[calc(100vh-1rem)] lg:max-h-[calc(100vh-1rem)] flex flex-col gap-2 overflow-y-auto lg:overflow-y-auto pb-[420px] lg:pb-0">
        <div className="glass-terminal border border-[#003B00] matrix-border-glow p-3 sm:p-4 lg:p-6 flex flex-col gap-3 sm:gap-4 flex-shrink-0">
          <div className="flex flex-col gap-4 border-b border-[#003B00] pb-4">
            <button
              onClick={() => window.location.reload()}
              className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto bg-transparent border-2 border-[#00FF41] flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)] hover:border-[#00FF41] transition-all duration-200 cursor-pointer group"
              aria-label="Reload page"
            >
              <img
                src="/logo/erhanportfoliologo.png"
                alt="Erhan Gumus Logo"
                className="w-full h-full object-contain p-2 filter drop-shadow-[0_0_8px_rgba(0,255,65,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(0,255,65,0.8)] transition-all duration-200"
              />
            </button>
            <div className="text-center">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-widest matrix-text-glow uppercase">
                {PORTFOLIO_DATA.name}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#008F11] font-bold mt-1">
                MAIN_CORE: OPERATOR
              </p>

              {/* Social Links */}
              <div className="flex justify-center gap-2 mt-3">
                <a
                  href="https://x.com/erhangumus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-3 py-1.5 border border-[#003B00] hover:border-[#00FF41] transition-all duration-200"
                  aria-label="Follow on X"
                >
                  <svg
                    className="w-4 h-4 text-[#008F11] group-hover:text-[#00FF41] transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/erhaneth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-3 py-1.5 border border-[#003B00] hover:border-[#00FF41] transition-all duration-200"
                  aria-label="View GitHub profile"
                >
                  <svg
                    className="w-4 h-4 text-[#008F11] group-hover:text-[#00FF41] transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/huseyingumus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center px-3 py-1.5 border border-[#003B00] hover:border-[#00FF41] transition-all duration-200"
                  aria-label="View LinkedIn profile"
                >
                  <svg
                    className="w-4 h-4 text-[#008F11] group-hover:text-[#00FF41] transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>

              {/* Schedule Call Button */}
              <a
                href="https://calendly.com/huseyinegumus"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-2 px-4 bg-[#00FF41] text-[#0d0208] text-[10px] sm:text-xs font-bold hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all flex items-center justify-center gap-2 group"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                SCHEDULE_CALL
              </a>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Context Toggle Button */}
            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              className={`
                w-full py-3 px-3 border text-xs sm:text-sm font-bold transition-all uppercase tracking-wider
                flex items-center justify-center gap-2
                ${
                  hasContext
                    ? "bg-[#003B00] text-[#00FF41] border-[#00FF41]"
                    : "bg-transparent text-[#008F11] border-[#003B00] hover:border-[#00FF41] hover:text-[#00FF41]"
                }
              `}
            >
              {hasContext && (
                <span className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse" />
              )}
              {getContextLabel()}
            </button>
          </div>
        </div>

        {/* Context Panel */}
        {showContextPanel && (
          <div className="glass-terminal border border-[#00FF41] p-4 sm:p-5 shadow-[0_0_20px_rgba(0,255,65,0.2)] animate-in slide-in-from-left duration-300 overflow-y-auto flex-shrink-0 max-h-[60vh] md:max-h-[45vh]">
            {/* Context Pills */}
            <ContextPills
              mode={userMode}
              selectedRole={selectedRole}
              selectedFocus={selectedFocus}
              onModeSelect={setUserMode}
              onRoleSelect={setSelectedRole}
              onFocusSelect={setSelectedFocus}
            />

            {/* Custom Context Input - Only show when mode is selected */}
            {userMode && (
              <div className="mt-3 pt-3 border-t border-[#003B00] animate-in fade-in duration-300">
                <div className="text-[10px] sm:text-[11px] text-[#008F11] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#008F11]" />
                  {userMode === "hiring"
                    ? translate("context.jobDetails")
                    : translate("context.anythingElse")}
                </div>
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder={
                    userMode === "hiring"
                      ? "Paste job description, company info..."
                      : "Questions? Topics you want to discuss..."
                  }
                  className="w-full bg-[#020202]/50 border border-[#003B00] p-2 text-[11px] sm:text-xs text-[#00FF41] focus:outline-none focus:border-[#00FF41] h-20 resize-none mono placeholder:text-[#003B00]"
                />

                {/* Mission Briefing Button - Only for recruiters with job description */}
                {userMode === "hiring" && customContext.trim().length > 50 && (
                  <button
                    onClick={() => {
                      setMissionJobDescription(customContext);
                      setShowMissionBriefing(true);
                    }}
                    className="w-full mt-2 py-2 px-3 border border-[#00FF41]/50 bg-[#00FF41]/10 text-[#00FF41] text-[10px] font-bold uppercase tracking-wider hover:bg-[#00FF41]/20 hover:border-[#00FF41] transition-all flex items-center justify-center gap-2 group"
                  >
                    <span className="w-2 h-2 bg-[#00FF41] group-hover:animate-pulse" />
                    ANALYZE_MISSION_FIT
                  </button>
                )}
              </div>
            )}

            {/* Clear All Button */}
            {hasContext && (
              <button
                onClick={() => {
                  setUserMode(null);
                  setSelectedRole(null);
                  setSelectedFocus(null);
                  setCustomContext("");
                }}
                className="w-full mt-3 py-2 text-[11px] sm:text-xs text-[#008F11] border border-[#003B00] hover:border-red-500/50 hover:text-red-400 transition-all uppercase tracking-wider font-medium"
              >
                {translate("context.resetContext")}
              </button>
            )}
          </div>
        )}

        {/* Network Activity */}
        <div className="glass-terminal border border-[#003B00] p-3 sm:p-4 flex-1 min-h-[100px] sm:min-h-[120px] overflow-hidden flex flex-col hidden lg:flex">
          <p className="text-[10px] text-[#008F11] uppercase font-bold mb-2 flex-shrink-0">
            {translate("context.networkActivity")}
          </p>
          <div className="flex-1 text-[9px] text-[#003B00] mono overflow-y-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mb-1">
                [ {new Date().toLocaleTimeString()} ] SECURE_PACKET_
                {Math.random().toString(16).slice(2, 8).toUpperCase()}...{" "}
                {isVoiceEnabled ? "UPLINK_STREAM" : "OK"}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="relative z-20 flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 h-full lg:h-[calc(100vh-1rem)] min-h-0 overflow-hidden">
        <section
          className={`transition-all duration-700 ease-in-out overflow-hidden flex flex-col ${
            activeProject || showGitHeatmap ? "lg:flex-[0.45]" : "lg:flex-1"
          }`}
        >
          <ChatInterface
            messages={messages}
            isLoading={isLoading && !isVoiceEnabled}
            onSendMessage={onSendMessage}
            isVoiceEnabled={isVoiceEnabled}
            isVoiceConnecting={isConnecting}
            onVoiceToggle={toggleVoice}
            onVoiceStop={stopVoiceChat}
            userVolume={userVolume}
            aiVolume={aiVolume}
            isAiTalking={isAiTalking}
            isLiveMode={isLiveMode}
            isOperatorTyping={isOperatorTyping}
          />
        </section>

        {/* Desktop: Side-by-side display */}
        {(activeProject || showGitHeatmap) && (
          <section className="hidden lg:flex flex-1 lg:flex-[0.55] w-full lg:w-auto animate-in slide-in-from-right fade-in duration-700 mt-4 lg:mt-0 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-1rem)]">
            {activeProject ? (
              <ProjectDisplay
                project={activeProject}
                onClose={() => setActiveProject(null)}
              />
            ) : (
              <GitHeatmap
                onClose={() => setShowGitHeatmap(false)}
                githubUsername="erhaneth" // You can make this configurable via .env
              />
            )}
          </section>
        )}
      </main>

      {/* Mobile: Modal/Popup display */}
      {activeProject && (
        <div
          className={`lg:hidden fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-500 ${
            isClosingProject ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(5px) saturate(100%)",
            WebkitBackdropFilter: "blur(15px) saturate(150%)",
          }}
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) {
              setIsClosingProject(true);
              setTimeout(() => {
                setActiveProject(null);
                setIsClosingProject(false);
              }, 500);
            }
          }}
        >
          <div
            className={`w-full max-h-[85vh] mt-16 sm:mt-20 flex flex-col rounded-t-3xl overflow-hidden ${
              isClosingProject ? "animate-slide-down" : "animate-slide-up"
            }`}
            style={{
              background: "rgba(2, 2, 2, 0.4)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
              border: "1px solid rgba(0, 255, 65, 0.2)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 65, 0.1) inset",
            }}
            onClick={(e) => e.stopPropagation()}
            key={activeProject.id}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-[#00FF41]/30 rounded-full" />
            </div>
            <ProjectDisplay
              project={activeProject}
              onClose={() => {
                setIsClosingProject(true);
                setTimeout(() => {
                  setActiveProject(null);
                  setIsClosingProject(false);
                }, 500);
              }}
            />
          </div>
        </div>
      )}

      {showGitHeatmap && (
        <div
          className={`lg:hidden fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-500 ${
            isClosingHeatmap ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(15px) saturate(150%)",
            WebkitBackdropFilter: "blur(15px) saturate(150%)",
          }}
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) {
              setIsClosingHeatmap(true);
              setTimeout(() => {
                setShowGitHeatmap(false);
                setIsClosingHeatmap(false);
              }, 500);
            }
          }}
        >
          <div
            className={`w-full max-h-[85vh] mt-16 sm:mt-20 flex flex-col rounded-t-3xl overflow-hidden ${
              isClosingHeatmap ? "animate-slide-down" : "animate-slide-up"
            }`}
            style={{
              background: "rgba(2, 2, 2, 0.4)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
              border: "1px solid rgba(0, 255, 65, 0.2)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 65, 0.1) inset",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-[#00FF41]/30 rounded-full" />
            </div>
            <GitHeatmap
              onClose={() => {
                setIsClosingHeatmap(true);
                setTimeout(() => {
                  setShowGitHeatmap(false);
                  setIsClosingHeatmap(false);
                }, 500);
              }}
              githubUsername="erhaneth" // You can make this configurable via .env
            />
          </div>
        </div>
      )}

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleSendResume}
        isLoading={isSendingResume}
      />

      {/* Language Activation Notification */}
      <LanguageActivation
        isActive={showActivation}
        language={language}
        onClose={() => setShowActivation(false)}
      />

      {/* Mission Briefing Modal */}
      {showMissionBriefing && missionJobDescription && (
        <MissionBriefing
          jobDescription={missionJobDescription}
          onProjectSelect={handleProjectShow}
          onClose={() => setShowMissionBriefing(false)}
        />
      )}
    </div>
  );
};

// Loading fallback for lazy-loaded components
const AdminLoading = () => (
  <div className="min-h-screen bg-[#0a0e27] text-[#00FF41] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse text-xl">[LOADING_ADMIN_MODULE...]</div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/admin3873"
          element={
            <Suspense fallback={<AdminLoading />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </Router>
  );
};
export default App;
