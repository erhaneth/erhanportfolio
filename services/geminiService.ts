import {
  GoogleGenAI,
  Type,
  FunctionDeclaration,
  GenerateContentResponse,
  Modality,
} from "@google/genai";
import { INITIAL_SYSTEM_PROMPT, PORTFOLIO_DATA } from "../constants";

// For live audio streaming only (requires client-side WebSocket)
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.error("[Gemini Service] API_KEY is missing for live streaming");
    throw new Error(
      "API_KEY is not configured for live streaming. Please set GEMINI_API_KEY environment variable."
    );
  }
  return new GoogleGenAI({ apiKey });
};

const showProjectTool: FunctionDeclaration = {
  name: "showProject",
  parameters: {
    type: Type.OBJECT,
    description: "Displays a specific project from the portfolio based on ID.",
    properties: {
      projectId: {
        type: Type.STRING,
        description:
          "The ID of the project to display. Options: tip-kurdish-keyboard, locked-in, love-letters, zion-mainframe",
      },
    },
    required: ["projectId"],
  },
};

const unlockSecretProjectTool: FunctionDeclaration = {
  name: "presentRiddle",
  parameters: {
    type: Type.OBJECT,
    description: "Presents a riddle to the user to unlock secret projects.",
    properties: {},
  },
};

const requestResumeEmailTool: FunctionDeclaration = {
  name: "requestResumeEmail",
  parameters: {
    type: Type.OBJECT,
    description:
      "Requests the user's email address to send Erhan's resume/CV. ONLY use this when the user EXPLICITLY asks for a resume, CV, or to receive the resume document. Do NOT use for general contact requests or other inquiries.",
    properties: {},
  },
};

const showGitHeatmapTool: FunctionDeclaration = {
  name: "showGitHeatmap",
  parameters: {
    type: Type.OBJECT,
    description:
      "Displays Erhan's Git contribution heatmap showing coding activity, languages used, and project distribution. ONLY use this when the user EXPLICITLY requests to see the chart, stats, or heatmap. Do NOT auto-trigger - instead, offer to show it and wait for user confirmation.",
    properties: {},
  },
};

const closeDisplayTool: FunctionDeclaration = {
  name: "closeDisplay",
  parameters: {
    type: Type.OBJECT,
    description:
      "Closes the currently displayed panel (project details or GitHub heatmap). Use when user says things like 'close this', 'close it', 'hide this', 'dismiss', 'go back', or 'close the project/heatmap'.",
    properties: {
      target: {
        type: Type.STRING,
        description:
          "What to close: 'project' for project panel, 'heatmap' for GitHub heatmap, or 'all' for everything",
      },
    },
    required: ["target"],
  },
};

// Simple cache for development to avoid hitting rate limits
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const getCacheKey = (messages: { role: string; content: string }[], userContext?: string) => {
  const lastMessage = messages[messages.length - 1]?.content || "";
  return `${lastMessage.substring(0, 100)}_${userContext?.substring(0, 50) || ""}`;
};

export const generateResponse = async (
  messages: { role: "user" | "assistant"; content: string }[],
  userContext?: string
) => {
  // Check cache first (only in development or if same exact message)
  const cacheKey = getCacheKey(messages, userContext);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (import.meta.env.DEV) {
      console.log("[Gemini] Using cached response");
    }
    return cached.data;
  }

  try {
    // Call serverless function instead of direct API
    const response = await fetch("/.netlify/functions/gemini-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, userContext }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Return in same format as direct API call
    const result = {
      candidates: [
        {
          content: {
            parts: [
              ...(data.text ? [{ text: data.text }] : []),
              ...(data.functionCall
                ? [{ functionCall: data.functionCall }]
                : []),
            ],
          },
          finishReason: data.finishReason,
        },
      ],
    };

    // Cache the response
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error: any) {
    if (error?.message) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw error;
  }
};

// Generate AI pitch for Mission Briefing (via serverless function)
export const generateMissionPitch = async (
  jobDescription: string,
  matchedSkills: string[],
  relevantProjects: string[],
  fitScore: number
): Promise<string> => {
  const fallback =
    "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications.";

  try {
    const response = await fetch("/.netlify/functions/gemini-pitch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription,
        matchedSkills,
        relevantProjects,
        fitScore,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate pitch:", response.status);
      return fallback;
    }

    const data = await response.json();
    return data.pitch || fallback;
  } catch (error) {
    console.error("Failed to generate pitch:", error);
    return fallback;
  }
};

// --- Live API Helpers ---

export function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectLive = async (
  callbacks: {
    onMessage: (message: any) => void;
    onOpen: () => void;
    onClose: () => void;
    onError: (e: any) => void;
  },
  userContext?: string
) => {
  const ai = getAI();
  const systemInstruction = userContext
    ? `${INITIAL_SYSTEM_PROMPT}\n\nUSER CONTEXT (Recruiter info/Job Desc):\n${userContext}`
    : INITIAL_SYSTEM_PROMPT;

  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onclose: callbacks.onClose,
      onerror: callbacks.onError,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
      },
      tools: [
        {
          functionDeclarations: [
            showProjectTool,
            unlockSecretProjectTool,
            requestResumeEmailTool,
            showGitHeatmapTool,
            closeDisplayTool,
          ],
        },
      ],
    },
  });
};

export function createPcmBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

// Legacy TTS support for text-only mode
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this naturally: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/pcm;base64,${base64Audio}` : "";
};

export async function playPcm(base64: string) {
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const binaryString = atob(base64.split(",")[1] || base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
}
