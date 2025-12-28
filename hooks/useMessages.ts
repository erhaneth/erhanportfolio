import { useState, useCallback } from "react";
import { Message, Project } from "../types";
import { PORTFOLIO_DATA, RIDDLE_DATA } from "../constants";
import { generateResponse } from "../services/geminiService";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `[IDENTITY VERIFIED: ERHAN GUMUS]\n[SYSTEM_LOG]: Mainframe accessed successfully.\nGreetings. I am the neural bridge to Erhan's work. What information are you authorized to view?`,
  timestamp: Date.now(),
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
  onResumeRequest?: () => void
): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [riddleActive, setRiddleActive] = useState(false);

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
          ? { ...m, metadata: { ...m.metadata, transient: false, fromVoice: true } }
          : m
      )
    );
  }, []);

  const handleSendMessage = useCallback(
    async (text: string): Promise<Project | null> => {
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

        const responseText = response.text || "SIGNAL INTERRUPTED. RETRYING...";
        const assistantMsg: Message = {
          id: `${Date.now() + 1}`,
          role: "assistant",
          content: responseText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (response.functionCalls) {
          for (const fc of response.functionCalls) {
            if (fc.name === "showProject") {
              const pId = (fc.args as any).projectId;
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
            }
          }
        }
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          {
            id: "err",
            role: "system",
            content:
              "[INTERNAL_ERROR_0x99]: System instability. Connection lost.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }

      return projectToShow;
    },
    [messages, userContext, riddleActive, onProjectShow, onResumeRequest]
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
