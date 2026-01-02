// Slack Webhook Integration via Netlify Function
// The frontend calls our Netlify function, which proxies to Slack (avoids CORS)

import { storeMessage, createOrUpdateSession } from "./firebaseService";
import { logger } from "../utils/logger";

// Use Netlify function endpoint for Slack
const getSlackEndpoint = () => {
  // In production, use the Netlify function
  // In development with netlify dev, also use the function
  return "/.netlify/functions/slack-webhook";
};

// Check if we're in test/dev mode (no webhook URL configured)
const isTestMode = () => {
  // In browser, we can't reliably check env vars, so we'll detect by
  // checking if we're in development mode (Vite sets this automatically)
  // The actual test mode will be detected when fetch fails
  try {
    // @ts-ignore - Vite provides this at build time
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

// Log to console in test mode (pretty formatted)
const logToConsole = (type: string, payload: any) => {
  const emoji = payload.text?.match(/[👋🎯📅💰📄🔧⭐📧🚨]/)?.[0] || "📢";
  logger.group(`${emoji} ${type} - Slack Notification (TEST MODE)`);
  logger.log(
    "Session ID:",
    payload.blocks?.[1]?.fields?.[0]?.text?.match(/`([^`]+)`/)?.[1] || "N/A"
  );
  logger.log("Time:", new Date().toLocaleString());

  // Extract and log key information
  if (payload.blocks) {
    payload.blocks.forEach((block: any, index: number) => {
      if (block.type === "section" && block.text) {
        logger.log(block.text.text || block.text);
      } else if (block.type === "section" && block.fields) {
        block.fields.forEach((field: any) => {
          logger.log(field.text);
        });
      } else if (block.type === "header") {
        logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logger.log(block.text.text);
        logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    });
  }

  logger.log("\n📋 Full Payload:", payload);
  logger.groupEnd();
};

interface SlackMessage {
  sessionId: string;
  visitorName?: string;
  message: string;
  messageType: "visitor" | "ai" | "system";
  context?: string;
  timestamp: Date;
}

// Generate a unique session ID for each visitor
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`.toUpperCase();
};

// Get or create session ID from localStorage
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("operatorSessionId");
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem("operatorSessionId", sessionId);
  }
  return sessionId;
};

// Notify Slack when operator mode is requested
export const notifyOperatorRequest = async (
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  context?: string
): Promise<boolean> => {
  // Store session in Firebase
  await createOrUpdateSession(sessionId, true, context);

  // Store recent conversation history in Firebase
  for (const msg of conversationHistory.slice(-5)) {
    await storeMessage(
      sessionId,
      msg.role === "user" ? "visitor" : "ai",
      msg.content
    );
  }

  const historyText = conversationHistory
    .slice(-5) // Last 5 messages for context
    .map(
      (m) =>
        `${m.role === "user" ? "👤 Visitor" : "🤖 AI"}: ${m.content.substring(
          0,
          200
        )}${m.content.length > 200 ? "..." : ""}`
    )
    .join("\n");

  const payload = {
    // Include session ID in the message text so we can track replies
    text: `🚨 New operator request from session ${sessionId}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 Operator Request - Portfolio",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Session ID:*\n\`${sessionId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `💬 _Reply in thread with \`[${sessionId}] your message\` to respond to this visitor_`,
          },
        ],
      },
      ...(context
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Context Provided:*\n${context.substring(0, 500)}${
                  context.length > 500 ? "..." : ""
                }`,
              },
            },
          ]
        : []),
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recent Conversation:*\n\`\`\`${
            historyText || "No messages yet"
          }\`\`\``,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔗 Open Portfolio",
              emoji: true,
            },
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://erhan.ai",
            action_id: "open_portfolio",
          },
        ],
      },
    ],
  };

  try {
    // In test mode, log to console instead
    if (isTestMode()) {
      logToConsole("Operator Request", payload);
      return true;
    }

    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If 404 or other error, fall back to console logging
    if (!response.ok) {
      logToConsole("Operator Request", payload);
      return true; // Return success so app continues normally
    }

    return response.ok;
  } catch (error) {
    // If fetch fails (network error, CORS, etc.), log to console
    logToConsole("Operator Request", payload);
    return true; // Return success so app continues normally
  }
};

// Send individual message to Slack (for live monitoring)
export const sendMessageToSlack = async (
  message: SlackMessage
): Promise<boolean> => {
  // Store in Firebase for two-way sync
  await storeMessage(
    message.sessionId,
    message.messageType === "visitor" ? "visitor" : "ai",
    message.message
  );

  const emoji =
    message.messageType === "visitor"
      ? "👤"
      : message.messageType === "ai"
      ? "🤖"
      : "⚙️";

  const payload = {
    text: `${emoji} [${message.sessionId}] ${message.message.substring(
      0,
      500
    )}`,
  };

  try {
    // In test mode, log to console instead
    if (isTestMode()) {
      logger.log(
        `💬 [${message.sessionId}] ${message.messageType.toUpperCase()}: ${
          message.message
        }`
      );
      return true;
    }

    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If 404 or other error, fall back to console logging
    if (!response.ok) {
      logger.log(
        `💬 [${message.sessionId}] ${message.messageType.toUpperCase()}: ${
          message.message
        }`
      );
      return true; // Return success so app continues normally
    }

    return response.ok;
  } catch (error) {
    // If fetch fails (network error, CORS, etc.), log to console
    console.log(
      `💬 [${message.sessionId}] ${message.messageType.toUpperCase()}: ${
        message.message
      }`
    );
    return true; // Return success so app continues normally
  }
};

// Notify Slack on first question (lightweight notification)
export const notifyFirstQuestion = async (
  sessionId: string,
  firstQuestion: string,
  userContext?: string
): Promise<boolean> => {
  const isRecruiter =
    userContext?.toLowerCase().includes("recruiter") ||
    userContext?.toLowerCase().includes("hiring") ||
    userContext?.toLowerCase().includes("job");

  const payload = {
    text: `👋 New visitor started conversation - Session ${sessionId}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: isRecruiter
            ? "🎯 New Recruiter Conversation"
            : "👋 New Visitor Conversation",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Session ID:*\n\`${sessionId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*First Question:*\n> ${firstQuestion.substring(0, 300)}${
            firstQuestion.length > 300 ? "..." : ""
          }`,
        },
      },
      ...(userContext
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Context:*\n${userContext.substring(0, 200)}${
                  userContext.length > 200 ? "..." : ""
                }`,
              },
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `💡 _Monitor this conversation - you'll be notified if they request direct connection or show high interest_`,
          },
        ],
      },
    ],
  };

  try {
    // In test mode, log to console instead
    if (isTestMode()) {
      logToConsole("First Question", payload);
      return true;
    }

    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If 404 or other error, fall back to console logging
    if (!response.ok) {
      logToConsole("First Question", payload);
      return true; // Return success so app continues normally
    }

    return response.ok;
  } catch (error) {
    // If fetch fails (network error, CORS, etc.), log to console
    logToConsole("First Question", payload);
    return true; // Return success so app continues normally
  }
};

// Predictive notification - tells operator what's coming
export const notifyPredictiveSignal = async (
  sessionId: string,
  signal: string,
  currentMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<boolean> => {
  const recentMessages = conversationHistory.slice(-2);
  const historyText = recentMessages
    .map(
      (m) =>
        `${m.role === "user" ? "👤" : "🤖"}: ${m.content.substring(0, 150)}${
          m.content.length > 150 ? "..." : ""
        }`
    )
    .join("\n");

  const payload = {
    text: `🔮 Predictive signal detected - Session ${sessionId}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔮 Predictive Signal - Prepare Response",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Session ID:*\n\`${sessionId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Signal:*\n${signal}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Current Message:*\n> ${currentMessage.substring(0, 200)}${
            currentMessage.length > 200 ? "..." : ""
          }`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recent Context:*\n\`\`\`${historyText}\`\`\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `💡 _They're likely about to ask: "${signal}" - Prepare your response now!_`,
          },
        ],
      },
    ],
  };

  try {
    if (isTestMode()) {
      logToConsole("Predictive Signal", payload);
      return true;
    }

    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If 404 or other error, fall back to console logging
    if (!response.ok) {
      logToConsole("Predictive Signal", payload);
      return true; // Return success so app continues normally
    }

    return response.ok;
  } catch (error) {
    // If fetch fails (network error, CORS, etc.), log to console
    logToConsole("Predictive Signal", payload);
    return true; // Return success so app continues normally
  }
};

// Smart intervention notification - triggered at high-value moments
export const notifyInterventionMoment = async (
  sessionId: string,
  trigger: string,
  conversationHistory: { role: string; content: string }[],
  userContext?: string,
  autoEscalated: boolean = false
): Promise<boolean> => {
  const recentMessages = conversationHistory.slice(-3);
  const historyText = recentMessages
    .map(
      (m) =>
        `${m.role === "user" ? "👤" : "🤖"}: ${m.content.substring(0, 150)}${
          m.content.length > 150 ? "..." : ""
        }`
    )
    .join("\n");

  const triggerEmojis: Record<string, string> = {
    recruiter_detected: "🎯",
    availability_question: "📅",
    salary_question: "💰",
    resume_request: "📄",
    deep_technical: "🔧",
    high_interest: "⭐",
    contact_request: "📧",
  };

  const emoji = triggerEmojis[trigger] || "🔔";

  const payload = {
    text: `${emoji} ${
      autoEscalated ? "🚀 AUTO-ESCALATED" : "Intervention moment detected"
    } - Session ${sessionId}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${
            autoEscalated
              ? "🚀 Auto-Escalated - You're Now Live!"
              : "High-Value Moment Detected"
          }`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Session ID:*\n\`${sessionId}\``,
          },
          {
            type: "mrkdwn",
            text: `*Trigger:*\n${trigger.replace(/_/g, " ").toUpperCase()}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recent Messages:*\n\`\`\`${historyText}\`\`\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: autoEscalated
              ? `✅ _Operator mode is ACTIVE - All messages forwarded to you. Reply in thread with \`[${sessionId}] your message\` to respond. Use \`[${sessionId}]ai: your message\` to respond as AI (invisible handoff)._`
              : `💬 _Perfect moment to jump in! Reply in thread with \`[${sessionId}] your message\` to surprise them. Use \`[${sessionId}]ai: your message\` to respond as AI._`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔗 Open Portfolio",
              emoji: true,
            },
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://erhan.ai",
            action_id: "open_portfolio",
          },
        ],
      },
    ],
  };

  try {
    // In test mode, log to console instead
    if (isTestMode()) {
      logToConsole("Intervention Moment", payload);
      return true;
    }

    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // If 404 or other error, fall back to console logging
    if (!response.ok) {
      logToConsole("Intervention Moment", payload);
      return true; // Return success so app continues normally
    }

    return response.ok;
  } catch (error) {
    // If fetch fails (network error, CORS, etc.), log to console
    logToConsole("Intervention Moment", payload);
    return true; // Return success so app continues normally
  }
};
