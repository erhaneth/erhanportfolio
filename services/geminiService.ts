import {
  GoogleGenAI,
  Type,
  FunctionDeclaration,
  GenerateContentResponse,
  Modality,
} from "@google/genai";
import { INITIAL_SYSTEM_PROMPT, PORTFOLIO_DATA } from "../constants";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  // Check if API key is actually available (not undefined string)
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.error("[Gemini Service] API_KEY is missing or invalid:", {
      exists: !!apiKey,
      type: typeof apiKey,
      value: apiKey ? `${apiKey.substring(0, 10)}...` : "null",
    });
    throw new Error(
      "API_KEY is not configured. Please set GEMINI_API_KEY environment variable."
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
          "The ID of the project to display. Options: tip-kurdish-keyboard, locked-in, secret-project-omega",
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
      "Displays Erhan's Git contribution heatmap showing coding activity, languages used, and project distribution. Use this when users ask about coding activity, productivity, GitHub contributions, or want to see development statistics.",
    properties: {},
  },
};

export const generateResponse = async (
  messages: { role: "user" | "assistant"; content: string }[],
  userContext?: string
) => {
  // Check if API key is available
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error(
      "API_KEY is not configured. Please set GEMINI_API_KEY environment variable."
    );
  }

  try {
    const ai = getAI();
    const systemInstruction = userContext
      ? `${INITIAL_SYSTEM_PROMPT}\n\nUSER CONTEXT (Recruiter info/Job Desc):\n${userContext}`
      : INITIAL_SYSTEM_PROMPT;

    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              showProjectTool,
              unlockSecretProjectTool,
              requestResumeEmailTool,
              showGitHeatmapTool,
            ],
          },
        ],
      },
    });

    return response;
  } catch (error: any) {
    // Re-throw with more context
    if (error?.message) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw error;
  }
};

// Generate AI pitch for Mission Briefing
export const generateMissionPitch = async (
  jobDescription: string,
  matchedSkills: string[],
  relevantProjects: string[],
  fitScore: number
): Promise<string> => {
  const ai = getAI();

  const prompt = `You are writing an OBJECTIVE assessment of Erhan Gumus for a recruiter who just pasted a job description.

JOB DESCRIPTION:
${jobDescription.substring(0, 1500)}

ANALYSIS RESULTS:
- Fit Score: ${fitScore}%
- Matched Skills: ${matchedSkills.join(", ") || "None detected"}
- Relevant Projects: ${
    relevantProjects.join(", ") || "Portfolio projects available"
  }

ERHAN'S BACKGROUND (from resume):
- Full-stack engineer with 3 years of experience
- React, Next.js, TypeScript, Python, Node.js
- Built high-traffic web apps for Museum of Life and Science (300k+ annual visitors)
- Integrated OpenAI APIs for AI interview assistant with real-time feedback
- Optimized performance: achieved 25% increase in page load speeds
- Playwright/Jest testing, CI/CD, Heroku/Google Cloud/Vercel deployments
- Collaborated with UX/UI designers and product managers
- Experience in non-profit environment building tools that empower learners

INSTRUCTIONS:
Write a 2-3 sentence pitch in THIRD PERSON (use "Erhan" or "he", never "I/my").

BE OBJECTIVE:
- If fit score is HIGH (70%+): Highlight the specific skill matches confidently
- If fit score is MEDIUM (40-69%): Acknowledge partial alignment, but note transferable skills
- If fit score is LOW (<40%): Be honest that it's not a direct match, BUT highlight his proven track record of rapidly mastering new technologies - give a specific example like "he taught himself [X] and shipped [Y] within weeks" rather than generic "fast learner" claims

NEVER use generic phrases like "passionate learner" or "quick to adapt". Instead, reference his actual pattern: building production apps in new stacks he didn't know before.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return (
      text ||
      "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications."
    );
  } catch (error) {
    console.error("Failed to generate pitch:", error);
    return "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications.";
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
