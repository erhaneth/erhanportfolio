import React, { useRef, useEffect, useState, useCallback } from "react";
import { Message } from "../types";
import TypewriterMarkdown from "./TypewriterMarkdown";
import ConversationDivider from "./ConversationDivider";
import { useLanguage } from "../contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import VoiceButton from "./VoiceButton";

// Drag-to-resize hook for mobile chat
const useResizable = (initial: number, min: number, max: number) => {
  const [height, setHeight] = useState(initial);
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef({ y: 0, h: 0 });

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      start.current = { y: e.clientY, h: height };
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!isDragging) return;
      setHeight(Math.min(max, Math.max(min, start.current.h + start.current.y - e.clientY)));
    },
    onPointerUp: (e: React.PointerEvent) => {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
  };

  return { height, isDragging, handlers };
};

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  // Voice props
  isVoiceEnabled?: boolean;
  isVoiceConnecting?: boolean;
  onVoiceToggle?: () => void;
  onVoiceStop?: () => void;
  userVolume?: number;
  aiVolume?: number;
  isAiTalking?: boolean;
  // Live mode
  isLiveMode?: boolean;
  isOperatorTyping?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  isVoiceEnabled = false,
  isVoiceConnecting = false,
  onVoiceToggle,
  onVoiceStop,
  userVolume = 0,
  aiVolume = 0,
  isAiTalking = false,
  isLiveMode = false,
  isOperatorTyping = false,
}) => {
  const { translate } = useLanguage();
  const [input, setInput] = React.useState("");
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(
    new Set()
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showVoicePulse, setShowVoicePulse] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Available slash commands
  const availableCommands = [
    { command: "/help", description: "Show help panel with all commands" },
    { command: "/clear", description: "Clear conversation and refresh" },
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show voice button pulse after 30 seconds if voice hasn't been used
  useEffect(() => {
    if (isVoiceEnabled) {
      setShowVoicePulse(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowVoicePulse(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isVoiceEnabled]);

  // Resizable chat - min 200px, max 85vh
  const { height, isDragging, handlers } = useResizable(
    400, // initial height
    200, // min height
    typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600 // max height (85vh)
  );

  // Filter commands based on input
  const filteredCommands = React.useMemo(() => {
    if (!input.startsWith("/")) return [];
    return availableCommands.filter((cmd) =>
      cmd.command.toLowerCase().startsWith(input.toLowerCase())
    );
  }, [input, availableCommands]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Show suggestions when typing "/" commands
    if (value.startsWith("/") && value.length > 0) {
      setShowCommandSuggestions(true);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandSuggestions(false);
    }
  };

  // Handle command selection
  const selectCommand = (command: string) => {
    setInput(command);
    setShowCommandSuggestions(false);
    setSelectedCommandIndex(0);
  };

  // Handle keyboard navigation in command suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCommandSuggestions || filteredCommands.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && showCommandSuggestions) {
      e.preventDefault();
      selectCommand(filteredCommands[selectedCommandIndex].command);
    } else if (e.key === "Escape") {
      setShowCommandSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowCommandSuggestions(false);
    onSendMessage(input);
    setInput("");
  };

  // Mark message as completed
  const handleTypeComplete = useCallback((messageId: string) => {
    setCompletedMessages((prev) => new Set([...prev, messageId]));
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Determine if a message should animate
  const shouldAnimate = (msg: Message, index: number) => {
    // Only animate assistant messages
    if (msg.role === "user" || msg.role === "system") return false;
    // Don't animate if already completed
    if (completedMessages.has(msg.id)) return false;
    // Don't animate transient messages (voice mode - they update incrementally)
    if (msg.metadata?.transient) return false;
    // Don't animate messages that came from voice mode
    if (msg.metadata?.fromVoice) return false;
    // Only animate the latest assistant message
    const lastAssistantIndex = messages
      .map((m, i) => ({ m, i }))
      .filter(
        ({ m }) =>
          m.role === "assistant" &&
          !m.metadata?.transient &&
          !m.metadata?.fromVoice
      )
      .pop()?.i;
    return index === lastAssistantIndex;
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col glass-terminal border border-[#003B00] shadow-[0_0_20px_rgba(0,59,0,0.5)] lg:h-full ${
        isMobile ? `fixed bottom-0 left-0 right-0 ${isVoiceEnabled ? 'z-[110]' : 'z-30'}` : ''
      }`}
      style={{ height: isMobile ? `${height}px` : undefined }}
    >
      {/* Drag Handle - Mobile Only */}
      <div
        {...handlers}
        className={`lg:hidden flex items-center justify-center py-2 cursor-ns-resize touch-none select-none border-b border-[#003B00] ${
          isDragging ? 'bg-[#00FF41]/20' : 'bg-[#003B00]/40 active:bg-[#003B00]/60'
        } transition-colors`}
      >
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-12 h-1.5 rounded-full bg-[#00FF41]/70" />
        </div>
      </div>

      <div className="bg-[#003B00]/60 px-2 sm:px-4 py-2 flex justify-between items-center border-b border-[#00FF41] flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex gap-1">
            <div
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                isLiveMode ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
            />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500" />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold text-[#00FF41] tracking-[0.2em] sm:tracking-[0.3em] uppercase matrix-text-glow truncate">
            {isLiveMode ? "👨‍💻 Live with Erhan" : "Zion_Term://COMMS_NODE_21"}
          </span>
        </div>
        <div className="text-[8px] sm:text-[9px] text-[#008F11] mono hidden sm:block">
          {isLiveMode ? (
            <span className="text-[#00FF41] animate-pulse">● LIVE</span>
          ) : (
            <>
              {translate("chat.status")}:{" "}
              <span className="text-[#00FF41] animate-pulse">
                {translate("chat.encrypted")}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 mono scroll-smooth"
      >
        {messages.map((msg, index) => {
          // Check if this is a divider message
          if (msg.metadata?.isDivider) {
            return (
              <ConversationDivider
                key={msg.id}
                type={
                  msg.metadata.dividerType as
                    | "operator_joined"
                    | "operator_left"
                    | "system"
                }
                message={
                  msg.content !== "OPERATOR_JOINED" ? msg.content : undefined
                }
              />
            );
          }

          return (
            <div key={msg.id} className="group flex flex-col space-y-2">
              <div
                className={`flex items-center gap-2 text-[10px] font-bold ${
                  msg.role === "user"
                    ? "justify-end text-[#008F11]"
                    : "justify-start text-[#00FF41]"
                }`}
              >
                {msg.role === "user" ? (
                  <>
                    <span>{translate("chat.remoteUser")}</span>
                    <div className="w-1.5 h-1.5 bg-[#008F11]" />
                  </>
                ) : (
                  <>
                    <div
                      className={`w-1.5 h-1.5 ${
                        msg.metadata?.fromOperator
                          ? "bg-[#FFD700]"
                          : "bg-[#00FF41]"
                      } shadow-[0_0_5px_${
                        msg.metadata?.fromOperator ? "#FFD700" : "#00FF41"
                      }]`}
                    />
                    <span>
                      {msg.metadata?.fromOperator
                        ? "ERHAN"
                        : translate("chat.systemArchive")}
                    </span>
                  </>
                )}
              </div>
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm leading-relaxed border-t border-b border-[#003B00] transition-all group-hover:border-[#00FF41]/40 markdown-content ${
                    msg.role === "user"
                      ? "text-[#00FF41] text-right bg-[#00FF41]/5"
                      : "text-[#00FF41] bg-[#003B00]/10"
                  }`}
                >
                  {shouldAnimate(msg, index) ? (
                    <TypewriterMarkdown
                      text={msg.content}
                      speed={msg.id === "welcome" ? 18 : 8}
                      onComplete={() => handleTypeComplete(msg.id)}
                    />
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-[#00FF41]">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-[#008F11]">{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-3 space-y-1 ml-4">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="ml-2">{children}</li>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-[#003B00]/50 px-1.5 py-0.5 rounded text-[#008F11] font-mono text-xs">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-[#003B00]/50 p-3 rounded text-[#008F11] font-mono text-xs overflow-x-auto mb-3">
                              {children}
                            </code>
                          );
                        },
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">
                            {children}
                          </h3>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[#00FF41]/40 pl-4 my-3 italic text-[#008F11]">
                            {children}
                          </blockquote>
                        ),
                        hr: () => <hr className="my-4 border-[#003B00]" />,
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#008F11] hover:text-[#00FF41] underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && !isLiveMode && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-1.5 h-4 bg-[#00FF41] animate-pulse" />
            <span className="text-[#00FF41] text-[10px] font-bold tracking-tighter animate-pulse uppercase">
              _ Awaiting_Neural_Response...
            </span>
          </div>
        )}
        {isLiveMode && isOperatorTyping && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-1.5 h-4 bg-[#FFD700] animate-pulse" />
            <span className="text-[#FFD700] text-[10px] font-bold tracking-tighter animate-pulse uppercase">
              Erhan is typing...
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-2 sm:p-4 bg-[#020202] border-t border-[#003B00] relative flex-shrink-0"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF41]/20 to-transparent"></div>

        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 relative">
          {/* Command Suggestions Dropdown */}
          {showCommandSuggestions && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#020202] border border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.3)] z-50 max-h-32 overflow-y-auto">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.command}
                  onClick={() => selectCommand(cmd.command)}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedCommandIndex
                      ? "bg-[#00FF41]/20 border-l-2 border-[#00FF41]"
                      : "hover:bg-[#003B00]/50"
                  }`}
                >
                  <div className="text-[#00FF41] text-sm font-bold mono">
                    {cmd.command}
                  </div>
                  <div className="text-[#008F11] text-xs mt-0.5">
                    {cmd.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Normal input mode */}
          {!isVoiceEnabled && !isVoiceConnecting ? (
            <>
              <span className="text-[#00FF41] font-bold animate-pulse text-base sm:text-lg">
                &gt;
              </span>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={translate("chat.placeholder")}
                aria-label="Type your message"
                className="flex-1 bg-transparent border-none py-2 text-base text-[#00FF41] focus:outline-none placeholder:text-[#003B00] mono caret-[#00FF41]"
              />

              {/* Voice button */}
              {onVoiceToggle && (
                <div className="relative">
                  {showVoicePulse && (
                    <div className="absolute -inset-1 bg-[#00FF41]/20 animate-pulse rounded" />
                  )}
                  <VoiceButton
                    isActive={false}
                    isConnecting={false}
                    onClick={() => {
                      setShowVoicePulse(false);
                      onVoiceToggle();
                    }}
                    userVolume={userVolume}
                    aiVolume={aiVolume}
                    isAiTalking={isAiTalking}
                  />
                </div>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="group p-2 text-[#008F11] hover:text-[#00FF41] transition-all disabled:opacity-0"
              >
                <svg
                  className="w-6 h-6 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          ) : (
            /* Voice mode - replaces entire input row */
            <VoiceButton
              isActive={isVoiceEnabled}
              isConnecting={isVoiceConnecting}
              onClick={onVoiceToggle!}
              onStop={onVoiceStop}
              userVolume={userVolume}
              aiVolume={aiVolume}
              isAiTalking={isAiTalking}
            />
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
