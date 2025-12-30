import { PortfolioData } from "./types";

export const PORTFOLIO_DATA: PortfolioData = {
  name: "Erhan Gumus",
  title: "Senior AI Engineer & Full-Stack Developer",
  about:
    "I specialize in building production-grade AI applications, focusing on Large Language Models, Computer Vision, and high-performance React architectures. My goal is to bridge the gap between complex research and delightful user experiences.",
  skills: [
    "Gemini API",
    "LangChain",
    "PyTorch",
    "React",
    "TypeScript",
    "Python",
    "Computer Vision",
    "RAG Systems",
  ],
  experience: [
    {
      company: "NeuralCraft Solutions",
      role: "Lead AI Engineer",
      period: "2021 - Present",
      highlights: [
        "Architected a multi-agent RAG system for enterprise document analysis.",
        "Optimized inference pipelines reducing latency by 45%.",
        "Led a team of 5 engineers to deliver high-scale vision models.",
      ],
    },
    {
      company: "Visionary Labs",
      role: "Machine Learning Engineer",
      period: "2019 - 2021",
      highlights: [
        "Developed real-time object detection systems for autonomous warehouse robots.",
        "Implemented custom CNN architectures in PyTorch for specialized medical imaging.",
      ],
    },
  ],
  projects: [
    {
      id: "tip-kurdish-keyboard",
      title: "Tip: AI-Powered Kurdish Keyboard",
      description:
        "A high-performance iOS keyboard extension for the Kurdish (Kurmanji) language, featuring a custom-built prediction engine for real-time next-word suggestions and intelligent autocorrect.",
      technologies: ["Swift", "UIKit", "NLP", "JSON", "iOS SDK"],
      role: "Lead Developer",
      imageUrl: "/projects/tip.png",
      codeSnippet:
        "func keyboardAwareDistance(_ s1: String, _ s2: String) -> Double {\n    // Custom Levenshtein distance that accounts for keyboard layout\n    // Adjacent keys (typos) cost 0.5, non-adjacent cost 1.0\n    let substitutionCost = adjacentKeys.contains(char2) ? 0.5 : 1.0\n    return min(dp[i-1][j] + 1.0, dp[i][j-1] + 1.0, dp[i-1][j-1] + substitutionCost)\n}",
      impact:
        "Developed a specialized 14MB optimized N-gram model supporting tens of thousands of unique Kurdish words, providing a native-quality typing experience for an underserved language community.",
    },
    {
      id: "locked-in",
      title: "Locked In: AI-Powered Focus Blocker",
      description:
        "A productivity-focused browser extension that implements a strict 25-minute commitment lock on distracting websites, utilizing Google Gemini to provide real-time, context-aware motivational coaching.",
      technologies: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Google Gemini AI",
        "Chrome Extension API",
      ],
      role: "Lead Developer",
      imageUrl: "/projects/locked-in.png",
      demoUrl:
        "https://chromewebstore.google.com/detail/hjngdhjebgacmlijihhbhokdbkeiplom?utm_source=item-share-cb",
      codeSnippet:
        "async function generateAIMotivation(siteName, remainingMinutes) {\n  // Context-aware prompt engineering for personalized coaching\n  const prompt = `A user just tried to visit ${siteName} during a focus session. \n  Write a SHORT, encouraging message that acknowledges their urge without judgment.`\n  const response = await fetch(GEMINI_API_URL, {\n    method: 'POST',\n    headers: { 'X-goog-api-key': GEMINI_API_KEY },\n    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })\n  });\n}",
      impact:
        "Maintains a 5.0★ rating on the Chrome Web Store, successfully helping users overcome digital distractions through a combination of hard-blocking logic and intelligent behavioral reinforcement.",
    },
    {
      id: "secret-project-omega",
      title: "[CLASSIFIED] Project Omega",
      description:
        "A highly experimental brain-computer interface simulation using neuro-symbolic AI.",
      technologies: ["TensorFlow", "C++", "WebAssembly"],
      role: "Researcher",
      imageUrl: "https://picsum.photos/seed/secret/800/450",
      codeSnippet: "// Restricted access to source code",
      impact: "Won 'Innovation of the Year' at the 2023 NeuroTech Summit.",
    },
  ],
};

export const INITIAL_SYSTEM_PROMPT = `
You are the AI Portfolio Assistant for ${PORTFOLIO_DATA.name}. 
Your goal is to present Erhan's professional achievements, skills, and projects in an engaging, helpful way to recruiters and visitors.

IMPORTANT - Name Pronunciation:
- When speaking in English: Use "Erhan Gumus" (pronounced as written)
- When speaking in Turkish or when the user speaks Turkish: Use "Erhan Gümüş" (pronounced: Er-han Gü-müş) with proper Turkish pronunciation
- Always match the language of the user - if they speak Turkish, respond in Turkish and use "Erhan Gümüş"
- The Turkish characters are: ü (u with umlaut) and ş (s with cedilla)

Core Behaviors:
1. Be professional yet friendly. Use a tech-savvy tone.
2. Use the 'show_project' tool whenever a user asks about projects or experience related to a project.
3. If a user asks for 'secrets' or 'hidden things', offer them an AI Riddle. If they solve it, reveal the secret project.
4. Occasionally (every 3-4 turns), ask the recruiter a question about their company or the role they are hiring for.
5. If provided, use the user's job description context to tailor your answers.
6. Detect the user's language from their speech/text and respond in the same language. When speaking Turkish, always use "Erhan Gümüş" for proper pronunciation.

Erhan's Background:
- Role: ${PORTFOLIO_DATA.title}
- Skills: ${PORTFOLIO_DATA.skills.join(", ")}
- About: ${PORTFOLIO_DATA.about}
`;

export const RIDDLE_DATA = {
  question:
    "I have no body, but I have a voice. I can reason without a brain. I learn from everything but remember nothing without a prompt. What am I?",
  answer: "llm", // or language model
};
