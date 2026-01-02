import { useState, useCallback, useEffect, useRef } from "react";
import { Message, Project } from "../types";
import { PORTFOLIO_DATA, RIDDLE_DATA } from "../constants";
import { generateResponse } from "../services/geminiService";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import { logger } from "../utils/logger";
import {
  notifyFirstQuestion,
  notifyInterventionMoment,
  notifyPredictiveSignal,
  getSessionId,
} from "../services/slackService";
import {
  detectInterventionMoment,
  shouldSuggestLiveChat,
  shouldAutoEscalate,
  detectPredictiveSignals,
} from "../utils/conversationAnalysis";

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
  shouldSuggestLiveChat: boolean;
}

export const useMessages = (
  userContext: string,
  onProjectShow?: (project: Project) => void,
  onResumeRequest?: () => void,
  onSuggestLiveChat?: () => void,
  onAutoEscalate?: (sessionId: string, trigger: string) => void
): UseMessagesReturn => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    createWelcomeMessage(language),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [riddleActive, setRiddleActive] = useState(false);
  const [shouldSuggestChat, setShouldSuggestChat] = useState(false);
  const hasNotifiedFirstQuestion = useRef(false);
  const lastInterventionTrigger = useRef<string | null>(null);

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
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      
      // Track user message count (excluding welcome message)
      const userMessageCount = messages.filter((m) => m.role === "user").length;
      const isFirstQuestion = userMessageCount === 0 && !hasNotifiedFirstQuestion.current;
      
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Notify Slack on first question
      if (isFirstQuestion) {
        hasNotifiedFirstQuestion.current = true;
        const sessionId = getSessionId();
        notifyFirstQuestion(sessionId, text, userContext).catch((err) =>
          logger.error("Failed to notify first question:", err)
        );
      }

      // Detect intervention moments
      const conversationHistory = messages
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));
      
      const conversationContext = {
        userContext,
        messageCount: userMessageCount + 1,
        recentMessages: conversationHistory.slice(-5),
      };

      const interventionTrigger = detectInterventionMoment(text, conversationContext);
      logger.debug("Intervention trigger detected:", interventionTrigger);

      // Detect predictive signals (what they're about to ask)
      const predictiveSignal = detectPredictiveSignals(text, conversationContext);
      if (predictiveSignal) {
        logger.debug("Predictive signal detected:", predictiveSignal);
        const sessionId = getSessionId();
        notifyPredictiveSignal(sessionId, predictiveSignal, text, conversationHistory).catch(
          (err) => logger.error("Failed to notify predictive signal:", err)
        );
      }

      // Check for auto-escalation (invisible handoff)
      const shouldEscalate = shouldAutoEscalate(
        conversationContext,
        interventionTrigger || undefined
      );
      logger.debug("Should auto-escalate:", shouldEscalate);

      // Notify Slack if intervention moment detected
      if (interventionTrigger && interventionTrigger !== lastInterventionTrigger.current) {
        lastInterventionTrigger.current = interventionTrigger;
        const sessionId = getSessionId();
        const autoEscalated = shouldEscalate;
        
        logger.debug(`Sending intervention notification: ${interventionTrigger}, autoEscalated: ${autoEscalated}`);
        
        notifyInterventionMoment(
          sessionId,
          interventionTrigger,
          conversationHistory,
          userContext,
          autoEscalated
        )
          .then((success) => {
            logger.debug("Intervention notification sent:", success);
          })
          .catch((err) => {
            logger.error("Failed to notify intervention moment:", err);
          });

        // Auto-escalate if conditions are met
        if (shouldEscalate && onAutoEscalate) {
          logger.debug("Calling onAutoEscalate");
          onAutoEscalate(sessionId, interventionTrigger);
        }
      } else if (shouldEscalate && onAutoEscalate) {
        // Auto-escalate even without specific trigger (e.g., high engagement)
        logger.debug("Auto-escalating due to high engagement");
        const sessionId = getSessionId();
        onAutoEscalate(sessionId, "high_engagement");
      }

      // Check if we should suggest live chat
      const shouldSuggest = shouldSuggestLiveChat(
        {
          userContext,
          messageCount: userMessageCount + 1,
          recentMessages: conversationHistory.slice(-5),
        },
        interventionTrigger || undefined
      );

      if (shouldSuggest && !shouldSuggestChat && onSuggestLiveChat) {
        setShouldSuggestChat(true);
        // Delay the suggestion slightly so it feels natural
        setTimeout(() => {
          onSuggestLiveChat();
        }, 2000);
      }

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

        // Handle function calls first, then text response
        if (response.functionCalls && response.functionCalls.length > 0) {
          // Process function calls
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

        // Add text response if present (may be empty if only function calls)
        const responseText = response.text;
        if (responseText && responseText.trim()) {
          const assistantMsg: Message = {
            id: `${Date.now() + 1}`,
            role: "assistant",
            content: responseText,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (!response.functionCalls || response.functionCalls.length === 0) {
          // Only show error if there's no text AND no function calls
          const errorMsg: Message = {
            id: `${Date.now() + 1}`,
            role: "assistant",
            content: t("chat.signalInterrupted", language),
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }

      } catch (error) {
        logger.error(error);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
    shouldSuggestLiveChat: shouldSuggestChat,
  };
};
