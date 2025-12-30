// Slack Webhook Integration via Netlify Function
// The frontend calls our Netlify function, which proxies to Slack (avoids CORS)

import { storeMessage, createOrUpdateSession } from "./firebaseService";

// Use Netlify function endpoint for Slack
const getSlackEndpoint = () => {
  // In production, use the Netlify function
  // In development with netlify dev, also use the function
  return "/.netlify/functions/slack-webhook";
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
    .map((m) => `${m.role === "user" ? "👤 Visitor" : "🤖 AI"}: ${m.content.substring(0, 200)}${m.content.length > 200 ? "..." : ""}`)
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
                text: `*Context Provided:*\n${context.substring(0, 500)}${context.length > 500 ? "..." : ""}`,
              },
            },
          ]
        : []),
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recent Conversation:*\n\`\`\`${historyText || "No messages yet"}\`\`\``,
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
            url: typeof window !== "undefined" ? window.location.origin : "https://erhan.ai",
            action_id: "open_portfolio",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to notify Slack:", error);
    return false;
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
    text: `${emoji} [${message.sessionId}] ${message.message.substring(0, 500)}`,
  };

  try {
    const response = await fetch(getSlackEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to send to Slack:", error);
    return false;
  }
};
