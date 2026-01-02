// Conversation analysis utilities for smart intervention detection

export type InterventionTrigger =
  | "recruiter_detected"
  | "availability_question"
  | "salary_question"
  | "resume_request"
  | "deep_technical"
  | "high_interest"
  | "contact_request"
  | null;

interface ConversationContext {
  userContext?: string;
  messageCount: number;
  recentMessages: { role: string; content: string }[];
}

/**
 * Analyzes conversation to detect high-value moments for operator intervention
 */
export const detectInterventionMoment = (
  currentMessage: string,
  context: ConversationContext
): InterventionTrigger => {
  const message = currentMessage.toLowerCase();
  const { userContext, messageCount, recentMessages } = context;

  // Check if recruiter mode is detected (first time)
  if (
    userContext &&
    (userContext.toLowerCase().includes("recruiter") ||
      userContext.toLowerCase().includes("hiring") ||
      userContext.toLowerCase().includes("job")) &&
    messageCount <= 2
  ) {
    return "recruiter_detected";
  }

  // Availability/start date questions
  const availabilityKeywords = [
    "available",
    "start date",
    "when can you start",
    "start immediately",
    "availability",
    "when are you free",
    "when are you available", // Added explicit phrase
    "timeline",
    "ne zaman başlayabilirsin",
    "müsait misin",
    "müsait", // Added single word
    "ne zaman", // Added "when" in Turkish
  ];
  if (availabilityKeywords.some((keyword) => message.includes(keyword))) {
    return "availability_question";
  }

  // Salary/compensation questions
  const salaryKeywords = [
    "salary",
    "compensation",
    "pay",
    "rate",
    "hourly",
    "budget",
    "maaş",
    "ücret",
    "fiyat",
  ];
  if (salaryKeywords.some((keyword) => message.includes(keyword))) {
    return "salary_question";
  }

  // Resume/CV requests
  const resumeKeywords = [
    "resume",
    "cv",
    "curriculum vitae",
    "send your resume",
    "can i see your resume",
    "özelge",
    "cv gönder",
  ];
  if (resumeKeywords.some((keyword) => message.includes(keyword))) {
    return "resume_request";
  }

  // Contact information requests
  const contactKeywords = [
    "email",
    "phone",
    "contact",
    "reach out",
    "get in touch",
    "iletişim",
    "telefon",
    "e-posta",
  ];
  if (contactKeywords.some((keyword) => message.includes(keyword))) {
    return "contact_request";
  }

  // High interest signals
  const interestKeywords = [
    "perfect fit",
    "great match",
    "interested",
    "would love to",
    "sounds great",
    "mükemmel",
    "harika",
    "ilgileniyorum",
  ];
  if (interestKeywords.some((keyword) => message.includes(keyword))) {
    return "high_interest";
  }

  // Deep technical conversation (3+ exchanges with technical terms)
  if (messageCount >= 5) {
    const technicalTerms = [
      "architecture",
      "scalability",
      "performance",
      "optimization",
      "framework",
      "library",
      "api",
      "database",
      "mimari",
      "performans",
      "optimizasyon",
    ];
    const technicalMessageCount = recentMessages.filter((msg) =>
      technicalTerms.some((term) => msg.content.toLowerCase().includes(term))
    ).length;

    if (technicalMessageCount >= 2) {
      return "deep_technical";
    }
  }

  return null;
};

/**
 * Determines if AI should suggest live chat to the user
 */
export const shouldSuggestLiveChat = (
  context: ConversationContext,
  lastInterventionTrigger?: InterventionTrigger
): boolean => {
  const { messageCount, userContext } = context;

  // Suggest after 5-7 messages if recruiter
  if (userContext && messageCount >= 5 && messageCount <= 7) {
    const isRecruiter =
      userContext.toLowerCase().includes("recruiter") ||
      userContext.toLowerCase().includes("hiring") ||
      userContext.toLowerCase().includes("job");
    if (isRecruiter) {
      return true;
    }
  }

  // Suggest immediately after high-value triggers
  if (
    lastInterventionTrigger &&
    ["availability_question", "salary_question", "high_interest"].includes(
      lastInterventionTrigger
    )
  ) {
    return true;
  }

  return false;
};

/**
 * Determines if operator mode should auto-escalate (invisible handoff)
 * This is the "hired on the spot" feature - automatic, seamless, predictive
 */
export const shouldAutoEscalate = (
  context: ConversationContext,
  lastInterventionTrigger?: InterventionTrigger
): boolean => {
  const { messageCount, userContext, recentMessages } = context;

  // Auto-escalate on high-value triggers (immediate)
  if (
    lastInterventionTrigger &&
    [
      "availability_question",
      "salary_question",
      "resume_request",
      "contact_request",
      "high_interest",
    ].includes(lastInterventionTrigger)
  ) {
    return true;
  }

  // Auto-escalate if recruiter + 3+ messages (engagement threshold)
  if (userContext) {
    const isRecruiter =
      userContext.toLowerCase().includes("recruiter") ||
      userContext.toLowerCase().includes("hiring") ||
      userContext.toLowerCase().includes("job");

    if (isRecruiter && messageCount >= 3) {
      return true;
    }
  }

  // Auto-escalate after 7+ messages (high engagement)
  if (messageCount >= 7) {
    return true;
  }

  // Auto-escalate on deep technical (5+ messages with technical terms)
  if (messageCount >= 5) {
    const technicalTerms = [
      "architecture",
      "scalability",
      "performance",
      "optimization",
      "framework",
      "api",
      "database",
      "system design",
      "mimari",
      "performans",
    ];
    const technicalMessageCount = recentMessages.filter((msg) =>
      technicalTerms.some((term) => msg.content.toLowerCase().includes(term))
    ).length;

    if (technicalMessageCount >= 2) {
      return true;
    }
  }

  return false;
};

/**
 * Detects predictive signals - what they're about to ask
 * Helps operator prepare responses in advance
 */
export const detectPredictiveSignals = (
  currentMessage: string,
  context: ConversationContext
): string | null => {
  const message = currentMessage.toLowerCase();
  const { recentMessages } = context;

  // Detect incomplete questions or leading statements
  const predictivePatterns = [
    {
      pattern: /we're looking for|we need|we want/i,
      signal: "about to describe requirements",
    },
    {
      pattern: /when can you|are you available|start date/i,
      signal: "about to ask availability",
    },
    {
      pattern: /what's your|how much|salary|rate|compensation/i,
      signal: "about to ask compensation",
    },
    {
      pattern: /tell me more about|can you explain|how did you/i,
      signal: "deep dive question coming",
    },
    {
      pattern: /we have|our team|our company/i,
      signal: "about to share company info",
    },
  ];

  for (const { pattern, signal } of predictivePatterns) {
    if (pattern.test(message)) {
      return signal;
    }
  }

  // Detect if they're typing a long message (engagement)
  if (message.length > 100 && recentMessages.length >= 2) {
    return "high engagement - detailed question";
  }

  return null;
};
