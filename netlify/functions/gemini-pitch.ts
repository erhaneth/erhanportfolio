import { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

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

    const { jobDescription, matchedSkills, relevantProjects, fitScore } =
      JSON.parse(event.body || "{}");

    if (!jobDescription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Job description required" }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are writing an OBJECTIVE assessment of Erhan Gumus for a recruiter who just pasted a job description.

JOB DESCRIPTION:
${jobDescription.substring(0, 1500)}

ANALYSIS RESULTS:
- Fit Score: ${fitScore || 0}%
- Matched Skills: ${matchedSkills?.join(", ") || "None detected"}
- Relevant Projects: ${
      relevantProjects?.join(", ") || "Portfolio projects available"
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

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    const fallback =
      "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ pitch: text || fallback }),
    };
  } catch (error: any) {
    console.error("[gemini-pitch] Error:", error);
    return {
      statusCode: 200, // Return 200 with fallback to not break the UI
      headers,
      body: JSON.stringify({
        pitch:
          "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications.",
      }),
    };
  }
};
