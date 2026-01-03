import { useState, useCallback, useEffect } from "react";
import { Message, Project } from "../types";
import { PORTFOLIO_DATA, RIDDLE_DATA } from "../constants";
import { generateResponse } from "../services/geminiService";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";

const createWelcomeMessage = (lang: "en" | "tr"): Message => {
  const content =
    lang === "tr"
      ? `[KİMLİK DOĞRULANDI: ERHAN GÜMÜŞ]\n[SİSTEM_KAYDI]: Ana sistem başarıyla erişildi.\nSelamlar. Ben Erhan'ın çalışmalarına giden sinir köprüsüyüm. Hangi bilgilere ulasmak icin yetki istersiniz?`
      : `[IDENTITY VERIFIED: ERHAN GUMUS]\n[SYSTEM_LOG]: Mainframe accessed successfully.\nGreetings. I am the neural bridge to Erhan's work. What information would you like to be authorized to view?`;

  return {
    id: "welcome",
    role: "assistant",
    content,
    timestamp: Date.now(),
  };
};

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  riddleActive: boolean;
  addMessage: (message: Message) => void;
  addSystemMessage: (content: string) => void;
  handleSendMessage: (text: string) => Promise<Project | null>;
  updateTransientMessage: (
    role: "user" | "assistant",
    text: string,
    append?: boolean
  ) => void;
  finalizeTransientMessages: () => void;
}

export const useMessages = (
  userContext: string,
  onProjectShow?: (project: Project) => void,
  onResumeRequest?: () => void,
  onShowGitHeatmap?: () => void
): UseMessagesReturn => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    createWelcomeMessage(language),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [riddleActive, setRiddleActive] = useState(false);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      const welcomeIndex = prev.findIndex((m) => m.id === "welcome");
      if (welcomeIndex !== -1) {
        const newMessages = [...prev];
        newMessages[welcomeIndex] = createWelcomeMessage(language);
        return newMessages;
      }
      return prev;
    });
  }, [language]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: "system",
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const updateTransientMessage = useCallback(
    (role: "user" | "assistant", text: string, append: boolean = true) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role && last.metadata?.transient) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: append ? last.content + text : text },
          ];
        }
        return [
          ...prev,
          {
            id: `voice-${role}-${Date.now()}`,
            role,
            content: text,
            timestamp: Date.now(),
            metadata: { transient: true, fromVoice: true },
          },
        ];
      });
    },
    []
  );

  const finalizeTransientMessages = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.metadata?.transient
          ? {
              ...m,
              metadata: { ...m.metadata, transient: false, fromVoice: true },
            }
          : m
      )
    );
  }, []);

  const handleSendMessage = useCallback(
    async (text: string): Promise<Project | null> => {
      // Check network connectivity first
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setMessages((prev) => [
          ...prev,
          {
            id: `offline-${Date.now()}`,
            role: "system",
            content:
              "[ERROR]: You are currently offline. Please check your internet connection and try again.",
            timestamp: Date.now(),
          },
        ]);
        return null;
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let projectToShow: Project | null = null;

      try {
        // Check riddle answer
        if (
          riddleActive &&
          (text.toLowerCase().includes("llm") ||
            text.toLowerCase().includes("language model"))
        ) {
          setRiddleActive(false);
          const secretProject = PORTFOLIO_DATA.projects.find(
            (p) => p.id === "secret-project-omega"
          )!;
          projectToShow = secretProject;

          const successMsg: Message = {
            id: `${Date.now()}r`,
            role: "assistant",
            content:
              "[OVERRIDE DETECTED]: Riddle solution confirmed. Accessing restricted archives for Project Omega...",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, successMsg]);
          setIsLoading(false);

          if (onProjectShow) onProjectShow(secretProject);
          return projectToShow;
        }

        const response = await generateResponse(
          messages.concat(userMsg).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          userContext
        );

        // Extract text from response
        const responseText =
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          t("chat.signalInterrupted", language);

        // Extract function calls from response
        const parts = response.candidates?.[0]?.content?.parts || [];
        const functionCalls = parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => part.functionCall);

        const assistantMsg: Message = {
          id: `${Date.now() + 1}`,
          role: "assistant",
          content: responseText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (functionCalls && functionCalls.length > 0) {
          for (const fc of functionCalls) {
            if (fc.name === "showProject") {
              const pId =
                (fc.args as any)?.projectId || (fc as any).args?.projectId;
              const project = PORTFOLIO_DATA.projects.find((p) => p.id === pId);
              if (project) {
                projectToShow = project;
                if (onProjectShow) onProjectShow(project);
              }
            } else if (fc.name === "presentRiddle") {
              setRiddleActive(true);
              const riddleMsg: Message = {
                id: `${Date.now() + 2}`,
                role: "assistant",
                content: `[SECURITY_PROTOCOL_ALPHA]: Prove your sentience. Solve this: "${RIDDLE_DATA.question}"`,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, riddleMsg]);
            } else if (fc.name === "requestResumeEmail") {
              // Trigger email modal
              if (onResumeRequest) {
                onResumeRequest();
              }
            } else if (fc.name === "showGitHeatmap") {
              // Show git heatmap
              if (onShowGitHeatmap) {
                onShowGitHeatmap();
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Error in handleSendMessage:", error);

        // Provide more specific error messages
        let errorMessage =
          "[INTERNAL_ERROR_0x99]: System instability. Connection lost.";

        // Check if we're offline
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          errorMessage =
            "[ERROR]: You are currently offline. Please check your internet connection and try again.";
        } else if (error?.message) {
          if (
            error.message.includes("API_KEY") ||
            error.message.includes("apiKey") ||
            error.message.includes("authentication") ||
            error.message.includes("not configured")
          ) {
            errorMessage =
              "[ERROR]: API authentication failed. Please check configuration.";
          } else if (
            error.message.includes("network") ||
            error.message.includes("fetch") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("ERR_INTERNET_DISCONNECTED") ||
            error.message.includes("ERR_NETWORK_CHANGED")
          ) {
            errorMessage =
              "[ERROR]: Network connection failed. Please check your internet connection and try again.";
          } else if (
            error.message.includes("timeout") ||
            error.message.includes("TIMEOUT")
          ) {
            errorMessage =
              "[ERROR]: Request timeout. The server took too long to respond. Please try again.";
          } else if (
            error.message.includes("quota") ||
            error.message.includes("rate limit")
          ) {
            errorMessage =
              "[ERROR]: API rate limit exceeded. Please try again in a moment.";
          } else {
            errorMessage = `[ERROR]: ${
              error.message || "Unknown error occurred. Please try again."
            }`;
          }
        } else if (
          error?.name === "NetworkError" ||
          error?.name === "TypeError" ||
          error?.name === "Failed to fetch"
        ) {
          errorMessage =
            "[ERROR]: Network connection failed. Please check your internet connection and try again.";
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "system",
            content: errorMessage,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }

      return projectToShow;
    },
    [
      messages,
      userContext,
      riddleActive,
      onProjectShow,
      onResumeRequest,
      onShowGitHeatmap,
    ]
  );

  return {
    messages,
    isLoading,
    riddleActive,
    addMessage,
    addSystemMessage,
    handleSendMessage,
    updateTransientMessage,
    finalizeTransientMessages,
  };
};
