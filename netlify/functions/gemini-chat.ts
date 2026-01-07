import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { INITIAL_SYSTEM_PROMPT } from "../../constants";

// Tool declarations (same as client-side)
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

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const { messages, userContext } = JSON.parse(event.body || "{}");

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Messages array required" }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = userContext
      ? `${INITIAL_SYSTEM_PROMPT}\n\nUSER CONTEXT (Recruiter info/Job Desc):\n${userContext}`
      : INITIAL_SYSTEM_PROMPT;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: contents,
      config: {
        systemInstruction,
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

    // Extract the response data
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    const functionCall = candidate?.content?.parts?.find(
      (p: any) => p.functionCall
    )?.functionCall;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text,
        functionCall,
        finishReason: candidate?.finishReason,
      }),
    };
  } catch (error: any) {
    console.error("[gemini-chat] Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Internal server error",
      }),
    };
  }
};
