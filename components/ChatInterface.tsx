import React, { useRef, useEffect, useState, useCallback } from "react";
import { Message } from "../types";
import TypewriterText from "./TypewriterText";
import { useLanguage } from "../contexts/LanguageContext";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
}) => {
  const { translate } = useLanguage();
  const [input, setInput] = React.useState("");
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(
    new Set()
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
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
    <div className="flex flex-col h-full glass-terminal border border-[#003B00] shadow-[0_0_20px_rgba(0,59,0,0.5)]">
      <div className="bg-[#003B00]/60 px-4 py-2 flex justify-between items-center border-b border-[#00FF41]">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-[10px] font-bold text-[#00FF41] tracking-[0.3em] uppercase matrix-text-glow">
            {" "}
            Zion_Term://COMMS_NODE_21{" "}
          </span>
        </div>
        <div className="text-[9px] text-[#008F11] mono hidden sm:block">
          {translate("chat.status")}:{" "}
          <span className="text-[#00FF41] animate-pulse">
            {translate("chat.encrypted")}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 mono scroll-smooth"
      >
        {messages.map((msg, index) => (
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
                  <div className="w-1.5 h-1.5 bg-[#00FF41] shadow-[0_0_5px_#00FF41]" />
                  <span>{translate("chat.systemArchive")}</span>
                </>
              )}
            </div>
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed border-t border-b border-[#003B00] transition-all group-hover:border-[#00FF41]/40 ${
                  msg.role === "user"
                    ? "text-[#00FF41] text-right bg-[#00FF41]/5"
                    : "text-[#00FF41] bg-[#003B00]/10"
                }`}
              >
                {shouldAnimate(msg, index) ? (
                  <TypewriterText
                    text={msg.content}
                    speed={msg.id === "welcome" ? 18 : 8}
                    onComplete={() => handleTypeComplete(msg.id)}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-1.5 h-4 bg-[#00FF41] animate-pulse" />
            <span className="text-[#00FF41] text-[10px] font-bold tracking-tighter animate-pulse uppercase">
              _ Awaiting_Neural_Response...
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 bg-[#020202] border-t border-[#003B00] relative"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF41]/20 to-transparent"></div>
        <div className="flex items-center gap-3 px-2">
          <span className="text-[#00FF41] font-bold animate-pulse text-lg">
            &gt;
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={translate("chat.placeholder")}
            className="flex-1 bg-transparent border-none py-2 text-sm text-[#00FF41] focus:outline-none placeholder:text-[#003B00] mono caret-[#00FF41]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
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
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
