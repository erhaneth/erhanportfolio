import React, { useState, useEffect } from "react";
import { getActiveSessions, getSessionConversation, SessionInfo } from "../services/adminService";
import { setSessionLive } from "../services/liveSessionService";
import { useNavigate } from "react-router-dom";

interface ExpandedSession extends SessionInfo {
  conversation?: any[];
  isExpanded?: boolean;
}

const ADMIN_PASSWORD = "erhan2024"; // Change this to your desired password

export const AdminDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ExpandedSession[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load sessions
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Toggle session expansion
  const toggleSession = async (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.sessionId === sessionId) {
          return { ...s, isExpanded: !s.isExpanded };
        }
        return s;
      })
    );

    // Load conversation if expanding
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (session && !session.isExpanded) {
      const conversation = await getSessionConversation(sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, conversation } : s
        )
      );
    }
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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-[#00FF41] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="border border-[#00FF41] rounded p-8 backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-2 text-center">[ADMIN_ACCESS]</h1>
            <p className="text-[#00FF41]/70 text-center mb-6">
              Neural Interface Authentication Required
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#1a1f3a] border border-[#00FF41]/50 rounded px-4 py-2 text-[#00FF41] placeholder-[#00FF41]/50 focus:outline-none focus:border-[#00FF41]"
                autoFocus
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#00FF41] text-black font-bold py-2 rounded hover:bg-[#00DD33] transition"
              >
                [AUTHENTICATE]
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#0a0e27] text-[#00FF41] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#00FF41]/30">
          <div>
            <h1 className="text-3xl font-bold">[OPERATOR_DASHBOARD]</h1>
            <p className="text-[#00FF41]/70 text-sm mt-1">
              Active Sessions Monitor • Ghost Mode Control
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-[#1a1f3a] border border-[#00FF41]/50 text-[#00FF41] px-4 py-2 rounded hover:border-[#00FF41] transition"
          >
            [EXIT]
          </button>
        </div>

        {/* Loading/Error */}
        {loading && sessions.length === 0 && (
          <p className="text-center text-[#00FF41]/70">
            [SCANNING_MAINFRAME]...
          </p>
        )}
        {error && (
          <p className="text-center text-red-500 mb-4">{error}</p>
        )}

        {/* Sessions List */}
        {sessions.length === 0 && !loading ? (
          <div className="text-center py-12 text-[#00FF41]/70">
            <p>[NO_ACTIVE_SESSIONS]</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="border border-[#00FF41]/30 rounded bg-[#1a1f3a]/50 backdrop-blur-sm hover:border-[#00FF41]/60 transition"
              >
                {/* Session Header */}
                <div className="p-4 cursor-pointer" onClick={() => toggleSession(session.sessionId)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-[#0a0e27] px-2 py-1 rounded">
                          {session.sessionId}
                        </code>
                        {session.isLive ? (
                          <span className="text-red-500 text-xs font-bold animate-pulse">
                            🔴 LIVE
                          </span>
                        ) : (
                          <span className="text-yellow-500 text-xs font-bold">
                            🟡 GHOST
                          </span>
                        )}
                      </div>

                      <p className="text-[#00FF41]/90 text-sm mb-1">
                        {session.firstUserMessage || "..."}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[#00FF41]/70">
                        <span>Messages: {session.messageCount}</span>
                        <span>
                          Last: {new Date(session.lastMessageTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!session.isLive ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoin(session.sessionId);
                          }}
                          className="bg-[#00FF41] text-black px-4 py-2 rounded text-sm font-bold hover:bg-[#00DD33] transition"
                        >
                          [JOIN]
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeave(session.sessionId);
                          }}
                          className="bg-red-600/50 text-red-200 px-4 py-2 rounded text-sm font-bold hover:bg-red-600 transition"
                        >
                          [LEAVE]
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Conversation */}
                {session.isExpanded && (
                  <div className="border-t border-[#00FF41]/30 p-4 bg-[#0a0e27]/50">
                    {session.conversation ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {session.conversation.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              msg.role === "user"
                                ? "bg-[#1a3a1a]/50 border-l-2 border-[#00FF41]"
                                : msg.role === "operator"
                                ? "bg-[#3a2a1a]/50 border-l-2 border-yellow-500"
                                : "bg-[#1a1a2a]/50 border-l-2 border-[#00FF41]/50"
                            }`}
                          >
                            <strong className="text-[#00FF41]">
                              {msg.role.toUpperCase()}:
                            </strong>{" "}
                            <span className="text-[#00FF41]/80">
                              {msg.content?.substring(0, 150)}
                              {msg.content?.length > 150 ? "..." : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#00FF41]/70 text-xs">
                        [LOADING_CONVERSATION]...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
