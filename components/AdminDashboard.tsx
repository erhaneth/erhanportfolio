import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getActiveSessions,
  getSessionConversation,
  subscribeToConversation,
  SessionInfo,
} from "../services/adminService";
import {
  setSessionLive,
  sendOperatorMessage,
  setOperatorTyping,
} from "../services/liveSessionService";
import { useNavigate } from "react-router-dom";

interface ExpandedSession extends SessionInfo {
  conversation?: any[];
  messageInput?: string;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

// Helper function for relative time
const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

export const AdminDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ExpandedSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const navigate = useNavigate();
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected session
  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSession?.conversation]);

  // Focus input when session is selected
  useEffect(() => {
    if (selectedSessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedSessionId]);

  // Load sessions
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      setSessions((prev) => {
        return data.map((newSession) => {
          const existingSession = prev.find(
            (s) => s.sessionId === newSession.sessionId
          );
          if (existingSession) {
            return {
              ...newSession,
              conversation: existingSession.conversation,
              messageInput: existingSession.messageInput,
            };
          }
          return newSession;
        });
      });
      setError(null);
    } catch (err) {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Track active subscriptions
  const subscriptionsRef = useRef<{ [key: string]: () => void }>({});

  // Subscribe to conversation when session is selected
  useEffect(() => {
    if (!selectedSessionId) return;

    // Load initial conversation
    const loadConversation = async () => {
      const conversation = await getSessionConversation(selectedSessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === selectedSessionId ? { ...s, conversation } : s
        )
      );
    };
    loadConversation();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToConversation(selectedSessionId, (conversation) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === selectedSessionId ? { ...s, conversation } : s
        )
      );
    });
    subscriptionsRef.current[selectedSessionId] = unsubscribe;

    return () => {
      if (subscriptionsRef.current[selectedSessionId]) {
        subscriptionsRef.current[selectedSessionId]();
        delete subscriptionsRef.current[selectedSessionId];
      }
    };
  }, [selectedSessionId]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptionsRef.current).forEach((unsub) => unsub());
    };
  }, []);

  // Select a session
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsMobileConversationOpen(true);
  };

  // Join a session
  const handleJoin = async (sessionId: string) => {
    try {
      await setSessionLive(sessionId, true);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, isLive: true } : s
        )
      );
    } catch (err) {
      setError("Failed to join session");
    }
  };

  // Leave a session
  const handleLeave = async (sessionId: string) => {
    try {
      await setSessionLive(sessionId, false);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, isLive: false } : s
        )
      );
    } catch (err) {
      setError("Failed to leave session");
    }
  };

  // Handle message input change with typing indicator
  const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleMessageInputChange = useCallback(
    (sessionId: string, value: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, messageInput: value } : s
        )
      );

      setOperatorTyping(sessionId, true);

      if (typingTimeoutRef.current[sessionId]) {
        clearTimeout(typingTimeoutRef.current[sessionId]);
      }

      typingTimeoutRef.current[sessionId] = setTimeout(() => {
        setOperatorTyping(sessionId, false);
      }, 2000);
    },
    []
  );

  // Send message
  const handleSendMessage = async (sessionId: string) => {
    const session = sessions.find((s) => s.sessionId === sessionId);
    const message = session?.messageInput?.trim();
    if (!message) return;

    try {
      if (!session?.isLive) {
        await setSessionLive(sessionId, true);
      }

      await sendOperatorMessage(sessionId, message);

      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? { ...s, messageInput: "", isLive: true }
            : s
        )
      );
    } catch (err) {
      setError("Failed to send message");
    }
  };

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
      setError(null);
    } else {
      setError("Invalid password");
      setPassword("");
    }
  };

  // Stats
  const liveCount = sessions.filter((s) => s.isLive).length;
  const totalSessions = sessions.length;

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-[#00FF41] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="border border-[#00FF41]/30 rounded-lg p-8 bg-black/80 backdrop-blur-sm shadow-[0_0_50px_rgba(0,255,65,0.1)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00FF41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Operator Access</h1>
              <p className="text-[#00FF41]/60 text-sm">
                Enter credentials to access the dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Admin password"
                  className="w-full bg-[#1a1f3a] border border-[#00FF41]/30 rounded-lg px-4 py-3 text-[#00FF41] placeholder-[#00FF41]/40 focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50 transition"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#00FF41] text-[#0a0e27] font-bold py-3 rounded-lg hover:bg-[#00DD33] transition shadow-[0_0_20px_rgba(0,255,65,0.3)]"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with split panel
  return (
    <div className="h-screen bg-black text-[#00FF41] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#00FF41]/20 bg-black">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold hidden sm:block">Operator Dashboard</h1>
            <h1 className="text-xl font-bold sm:hidden">Dashboard</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 bg-[#1a1f3a] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[#00FF41]/80">{liveCount} Live</span>
              </span>
              <span className="flex items-center gap-1.5 bg-[#1a1f3a] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#00FF41]"></span>
                <span className="text-[#00FF41]/80">{totalSessions} Active</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-[#00FF41]/70 hover:text-[#00FF41] px-3 py-1.5 rounded-lg hover:bg-[#1a1f3a] transition text-sm"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main content - Split panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions Sidebar */}
        <aside className={`w-full md:w-80 lg:w-96 flex flex-col bg-black ${isMobileConversationOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#00FF41]/10">
            <h2 className="text-sm font-semibold text-[#00FF41]/70 uppercase tracking-wider">
              Sessions ({totalSessions})
            </h2>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {loading && sessions.length === 0 && (
              <div className="p-4 text-center text-[#00FF41]/50">
                <div className="animate-pulse">Scanning for sessions...</div>
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1a1f3a] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00FF41]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-[#00FF41]/50 text-sm">No active sessions</p>
                <p className="text-[#00FF41]/30 text-xs mt-1">Sessions will appear here when visitors chat</p>
              </div>
            )}

            {sessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => handleSelectSession(session.sessionId)}
                className={`p-4 border-b border-[#00FF41]/10 cursor-pointer transition hover:bg-[#1a1f3a]/50 ${
                  selectedSessionId === session.sessionId
                    ? "bg-[#1a1f3a] border-l-2 border-l-[#00FF41]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${session.isLive ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                    <code className="text-xs text-[#00FF41]/60">{session.sessionId.substring(0, 8)}</code>
                  </div>
                  <span className="text-xs text-[#00FF41]/40">
                    {getRelativeTime(session.lastMessageTime)}
                  </span>
                </div>

                <p className="text-sm text-[#00FF41]/90 line-clamp-2 mb-2">
                  {session.firstUserMessage || "No messages yet..."}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#00FF41]/50">
                    {session.messageCount} messages
                  </span>
                  {session.isLive && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Conversation Panel */}
        <main className={`flex-1 flex flex-col bg-black ${!isMobileConversationOpen && !selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
          {!selectedSession ? (
            // Empty state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1f3a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#00FF41]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-[#00FF41]/50">Select a session to view conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="flex-shrink-0 border-b border-[#00FF41]/20 p-4 bg-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setIsMobileConversationOpen(false)}
                      className="md:hidden p-2 -ml-2 text-[#00FF41]/70 hover:text-[#00FF41]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedSession.isLive ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                        <code className="text-sm font-mono">{selectedSession.sessionId}</code>
                      </div>
                      <p className="text-xs text-[#00FF41]/50 mt-0.5">
                        {selectedSession.messageCount} messages • Last active {getRelativeTime(selectedSession.lastMessageTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!selectedSession.isLive ? (
                      <button
                        onClick={() => handleJoin(selectedSession.sessionId)}
                        className="bg-[#00FF41] text-[#0a0e27] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00DD33] transition flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#0a0e27]"></span>
                        Go Live
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeave(selectedSession.sessionId)}
                        className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!selectedSession.conversation ? (
                  <div className="text-center py-8 text-[#00FF41]/50">
                    <div className="animate-pulse">Loading conversation...</div>
                  </div>
                ) : selectedSession.conversation.length === 0 ? (
                  <div className="text-center py-8 text-[#00FF41]/50">
                    No messages yet
                  </div>
                ) : (
                  selectedSession.conversation.map((msg, idx) => {
                    const isVisitor = msg.role === "user" || msg.role === "visitor";
                    const isOperator = msg.role === "operator";
                    const isAI = msg.role === "ai" || msg.role === "assistant";

                    return (
                      <div
                        key={idx}
                        className={`flex ${isVisitor ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            isVisitor
                              ? "bg-[#1a1f3a] rounded-tl-sm"
                              : isOperator
                              ? "bg-[#00FF41]/20 rounded-tr-sm"
                              : "bg-[#2a2f4a] rounded-tr-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${
                              isVisitor ? "text-blue-400" : isOperator ? "text-[#00FF41]" : "text-purple-400"
                            }`}>
                              {isVisitor ? "Visitor" : isOperator ? "You" : "AI"}
                            </span>
                            {msg.timestamp && (
                              <span className="text-xs text-[#00FF41]/30">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#00FF41]/90 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={conversationEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-[#00FF41]/20 p-4 bg-black">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={selectedSession.messageInput || ""}
                    onChange={(e) =>
                      handleMessageInputChange(selectedSession.sessionId, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(selectedSession.sessionId);
                      }
                    }}
                    placeholder="Type a message... (Enter to send)"
                    className="flex-1 bg-[#1a1f3a] border border-[#00FF41]/20 rounded-xl px-4 py-3 text-[#00FF41] placeholder-[#00FF41]/30 focus:outline-none focus:border-[#00FF41]/50 focus:ring-1 focus:ring-[#00FF41]/20 transition"
                  />
                  <button
                    onClick={() => handleSendMessage(selectedSession.sessionId)}
                    disabled={!selectedSession.messageInput?.trim()}
                    className="bg-[#00FF41] text-[#0a0e27] px-6 py-3 rounded-xl font-semibold hover:bg-[#00DD33] transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Send</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
