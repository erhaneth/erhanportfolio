// Intent Detection Service
// Uses Gemini to analyze conversation and detect user intent

type Intent = "casual" | "interested" | "hot_lead";

interface IntentAnalysis {
  intent: Intent;
  confidence: number; // 0-100
  signals: string[];
  summary: string;
}

// Cache to avoid redundant API calls
const analysisCache = new Map<
  string,
  { analysis: IntentAnalysis; timestamp: number }
>();
const CACHE_TTL = 60000; // 1 minute

// Simple hash for cache key
const hashConversation = (
  messages: { role: string; content: string }[]
): string => {
  return messages
    .slice(-5)
    .map((m) => `${m.role}:${m.content.substring(0, 50)}`)
    .join("|");
};

export const analyzeIntent = async (
  messages: { role: string; content: string }[]
): Promise<IntentAnalysis> => {
  // Need at least 2 user messages to analyze
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < 2) {
    return {
      intent: "casual",
      confidence: 100,
      signals: [],
      summary: "Not enough conversation to analyze",
    };
  }

  // Check cache
  const cacheKey = hashConversation(messages);
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.analysis;
  }

  try {
    const conversationText = messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "Visitor" : "AI"}: ${m.content}`)
      .join("\n");

    const prompt = `Analyze this conversation and classify the visitor's intent.

CONVERSATION:
${conversationText}

CLASSIFICATION:
- casual: Just browsing, curious, or testing the AI
- interested: Asking meaningful questions about skills, projects, or experience
- hot_lead: Showing hiring signals (discussing roles, availability, interview, company needs, wants to connect)

Respond in JSON format only:
{
  "intent": "casual" | "interested" | "hot_lead",
  "confidence": 0-100,
  "signals": ["list of signals you detected"],
  "summary": "one sentence summary of what they're looking for"
}`;

    const response = await fetch("/.netlify/functions/slack-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "intent_analysis",
        prompt,
      }),
    });

    // For now, use a simple heuristic until we set up the proper endpoint
    // This will be replaced with actual Gemini call
    const analysis = analyzeIntentLocally(messages);

    // Cache the result
    analysisCache.set(cacheKey, { analysis, timestamp: Date.now() });

    return analysis;
  } catch (error) {
    console.error("[IntentService] Analysis failed:", error);
    // Fallback to local analysis
    return analyzeIntentLocally(messages);
  }
};

// Local heuristic analysis (fallback and for cost savings)
const analyzeIntentLocally = (
  messages: { role: string; content: string }[]
): IntentAnalysis => {
  const userMessages = messages.filter((m) => m.role === "user");
  const allText = userMessages.map((m) => m.content.toLowerCase()).join(" ");

  const signals: string[] = [];
  let score = 0;

  // Hot lead signals (high weight)
  const hotSignals = [
    {
      pattern: /\b(hiring|hire|recruit|position|role|opening|opportunity)\b/i,
      signal: "Hiring language detected",
    },
    {
      pattern: /\b(interview|schedule|call|meet|chat|connect|discuss)\b/i,
      signal: "Wants to connect",
    },
    {
      pattern: /\b(salary|compensation|rate|contract|offer)\b/i,
      signal: "Discussing terms",
    },
    {
      pattern: /\b(available|availability|start|when can|notice period)\b/i,
      signal: "Asking about availability",
    },
    {
      pattern: /\b(looking for|need|we need|our team|our company)\b/i,
      signal: "Company perspective",
    },
    {
      pattern: /\b(senior|lead|principal|staff|architect)\b/i,
      signal: "Senior role discussion",
    },
    {
      pattern: /\b(resume|cv|portfolio|linkedin)\b/i,
      signal: "Requesting materials",
    },
  ];

  // Interested signals (medium weight)
  const interestedSignals = [
    {
      pattern: /\b(experience|worked|built|project|skill)\b/i,
      signal: "Asking about experience",
    },
    {
      pattern: /\b(react|typescript|node|python|ai|ml|frontend|backend)\b/i,
      signal: "Technical discussion",
    },
    {
      pattern: /\b(how long|how many|what kind|which)\b/i,
      signal: "Deep questions",
    },
    {
      pattern: /\b(impressive|interesting|cool|great|amazing)\b/i,
      signal: "Positive sentiment",
    },
  ];

  // Check hot signals
  hotSignals.forEach(({ pattern, signal }) => {
    if (pattern.test(allText)) {
      signals.push(signal);
      score += 25;
    }
  });

  // Check interested signals
  interestedSignals.forEach(({ pattern, signal }) => {
    if (pattern.test(allText)) {
      signals.push(signal);
      score += 10;
    }
  });

  // Bonus for conversation depth
  if (userMessages.length >= 4) {
    score += 10;
    signals.push("Extended conversation");
  }
  if (userMessages.length >= 6) {
    score += 10;
    signals.push("Deep engagement");
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine intent based on score
  let intent: Intent;
  if (score >= 50) {
    intent = "hot_lead";
  } else if (score >= 25) {
    intent = "interested";
  } else {
    intent = "casual";
  }

  return {
    intent,
    confidence: Math.min(85, 50 + score / 2), // Conservative confidence
    signals,
    summary:
      signals.length > 0
        ? `Detected: ${signals.slice(0, 3).join(", ")}`
        : "General browsing",
  };
};

// Check if we should notify Slack (only on first hot_lead detection per session)
const notifiedSessions = new Set<string>();

export const shouldNotifySlack = (
  sessionId: string,
  intent: Intent
): boolean => {
  if (intent !== "hot_lead") return false;
  if (notifiedSessions.has(sessionId)) return false;
  notifiedSessions.add(sessionId);
  return true;
};

export const markSessionNotified = (sessionId: string): void => {
  notifiedSessions.add(sessionId);
};
