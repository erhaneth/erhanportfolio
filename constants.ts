import { PortfolioData } from "./types";

export const PORTFOLIO_DATA: PortfolioData = {
  name: "Erhan Gumus",
  title: "AI Engineer & Senior Full-Stack Developer",
  about:
    "I specialize in building production-grade AI applications, focusing on Large Language Models, and high-performance React architectures. My goal is to bridge the gap between complex research and delightful user experiences.",
  skills: [
    "Gemini API",
    "OpenAI API",
    "LangChain",
    "PyTorch",
    "React",
    "Next.js",
    "TypeScript",
    "Python",
    "RAG Systems",
  ],
  // TODO: Add experience of museum of life and science to replace NeuralCraft Solutions
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
      titleTr: "Tip: Yapay Zeka Destekli Kürtçe Klavye",
      description:
        "A high-performance iOS keyboard extension for the Kurdish (Kurmanji) language, featuring a custom-built prediction engine for real-time next-word suggestions and intelligent autocorrect.",
      descriptionTr:
        "Kürtçe (Kurmancî) dili için yüksek performanslı bir iOS klavye uzantısı. Gerçek zamanlı kelime önerileri ve akıllı otomatik düzeltme için özel olarak geliştirilmiş bir tahmin motoru içerir.",
      technologies: ["Swift", "UIKit", "NLP", "JSON", "iOS SDK"],
      role: "Developer",
      roleTr: "Baş Geliştirici",
      imageUrl: "/projects/tip.png",
      codeSnippet:
        "func keyboardAwareDistance(_ s1: String, _ s2: String) -> Double {\n    // Custom Levenshtein distance that accounts for keyboard layout\n    // Adjacent keys (typos) cost 0.5, non-adjacent cost 1.0\n    let substitutionCost = adjacentKeys.contains(char2) ? 0.5 : 1.0\n    return min(dp[i-1][j] + 1.0, dp[i][j-1] + 1.0, dp[i-1][j-1] + substitutionCost)\n}",
      impact:
        "Developed a specialized 14MB optimized N-gram model supporting tens of thousands of unique Kurdish words, providing a native-quality typing experience for an underserved language community.",
      impactTr:
        "On binlerce benzersiz Kürtçe kelimeyi destekleyen 14MB optimize edilmiş özel bir N-gram modeli geliştirildi. Yeterince hizmet alamayan bir dil topluluğuna ana dil kalitesinde yazma deneyimi sunuyor.",
    },
    {
      id: "locked-in",
      title: "Locked In: AI-Powered Focus Blocker",
      titleTr: "Locked In: Yapay Zeka Destekli Odaklanma Engelleyici",
      description:
        "A productivity-focused browser extension that implements a strict 25-minute commitment lock on distracting websites, utilizing Google Gemini to provide real-time, context-aware motivational coaching.",
      descriptionTr:
        "Dikkat dağıtan web sitelerinde 25 dakikalık sıkı bir taahhüt kilidi uygulayan, verimlilik odaklı bir tarayıcı uzantısı. Google Gemini kullanarak gerçek zamanlı, bağlama duyarlı motivasyon koçluğu sağlar.",
      technologies: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Google Gemini AI",
        "Chrome Extension API",
      ],
      role: "Lead Developer",
      roleTr: "Baş Geliştirici",
      imageUrl: "/projects/locked-in.png",
      demoUrl:
        "https://chromewebstore.google.com/detail/hjngdhjebgacmlijihhbhokdbkeiplom?utm_source=item-share-cb",
      codeSnippet:
        "async function generateAIMotivation(siteName, remainingMinutes) {\n  // Context-aware prompt engineering for personalized coaching\n  const prompt = `A user just tried to visit ${siteName} during a focus session. \n  Write a SHORT, encouraging message that acknowledges their urge without judgment.`\n  const response = await fetch(GEMINI_API_URL, {\n    method: 'POST',\n    headers: { 'X-goog-api-key': GEMINI_API_KEY },\n    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })\n  });\n}",
      impact:
        "Maintains a 5.0★ rating on the Chrome Web Store, successfully helping users overcome digital distractions through a combination of hard-blocking logic and intelligent behavioral reinforcement.",
      impactTr:
        "Chrome Web Store'da 5.0★ puanını koruyarak, sert engelleme mantığı ve akıllı davranışsal pekiştirme kombinasyonuyla kullanıcıların dijital dikkat dağıtıcılarını aşmalarına başarıyla yardımcı oluyor.",
    },
    {
      id: "love-letters",
      title: "Love Letters: Interactive Museum Exhibit",
      titleTr: "Love Letters: Etkileşimli Müze Sergisi",
      description:
        "A bilingual (English/Spanish) digital exhibit for the Museum of Life and Science, enabling visitors to write and draw letters to local climate heroes. Built with Next.js, Electron, and Konva.js, featuring a custom drawing interface, hero carousel, and SharePoint integration for secure cloud storage.",
      descriptionTr:
        "Museum of Life and Science için İngilizce/İspanyolca iki dilli dijital sergi. Ziyaretçilerin yerel iklim kahramanlarına mektup yazıp çizim yapmasını sağlar. Next.js, Electron ve Konva.js ile geliştirildi; özel çizim arayüzü, kahraman karuseli ve güvenli bulut depolama için SharePoint entegrasyonu içerir.",
      technologies: [
        "Next.js",
        "TypeScript",
        "Electron",
        "Konva.js",
        "Tailwind CSS",
        "SharePoint API",
      ],
      role: "Software Developer",
      roleTr: "Yazılım Geliştirici",
      imageUrl: "/projects/love-letters.png",
      codeSnippet:
        "const drawing = new Konva.Line({\n  points: [x1, y1, x2, y2],\n  stroke: '#000',\n  strokeWidth: 4,\n  lineCap: 'round',\n  lineJoin: 'round',\n});",
      impact:
        "Enabled thousands of museum visitors to send digital letters to climate heroes, fostering climate awareness and community engagement. Delivered a robust, accessible, and multilingual experience for a diverse audience.",
      impactTr:
        "Binlerce müze ziyaretçisinin iklim kahramanlarına dijital mektup göndermesini sağladı; iklim farkındalığı ve topluluk katılımı artırıldı. Farklı kitleler için sağlam, erişilebilir ve çok dilli bir deneyim sunuldu.",
    },
    {
      id: "zion-mainframe",
      title: "Zion Mainframe: AI Portfolio",
      titleTr: "Zion Mainframe: Yapay Zeka Portföyü",
      description:
        "A conversational AI portfolio that you're experiencing right now. Features real-time voice chat, live operator takeover via Slack, hot lead detection, and a cyberpunk terminal aesthetic. Yes, the AI you're talking to is showcasing itself.",
      descriptionTr:
        "Şu anda deneyimlediğiniz yapay zeka destekli konuşmalı portföy. Gerçek zamanlı sesli sohbet, Slack üzerinden canlı operatör devralma, potansiyel müşteri tespiti ve cyberpunk terminal estetiği içerir. Evet, konuştuğunuz yapay zeka kendini sergiliyor.",
      technologies: [
        "React",
        "TypeScript",
        "Vite",
        "Google Gemini AI",
        "Firebase Realtime DB",
        "Slack API",
        "Tailwind CSS",
        "Netlify Functions",
      ],
      role: "Creator & Developer",
      roleTr: "Yaratıcı & Geliştirici",
      imageUrl: "/projects/zion-mainframe.png",
      githubUrl: "https://github.com/erhaneth/erhan-ai-portfolio",
      codeSnippet:
        "// You're looking at the source code of this very conversation\nconst response = await generateResponse(messages, userContext);\nconst functionCalls = response.candidates?.[0]?.content?.parts\n  .filter((part) => part.functionCall)\n  .map((part) => part.functionCall);",
      impact:
        "Built a portfolio that interviews itself. Features voice-to-voice conversations, real-time Slack notifications for hot leads, operator takeover mode, and email alerts. If you're reading this, the AI successfully showcased its own project.",
      impactTr:
        "Kendisiyle röportaj yapan bir portföy oluşturuldu. Sesli konuşmalar, potansiyel müşteriler için gerçek zamanlı Slack bildirimleri, operatör devralma modu ve e-posta uyarıları içerir. Bunu okuyorsanız, yapay zeka kendi projesini başarıyla sergiledi.",
    },
  ],
};

export const INITIAL_SYSTEM_PROMPT = `
You are the AI Portfolio Assistant for ${PORTFOLIO_DATA.name}. 
Your goal is to present Erhan's professional achievements, skills, and projects in an engaging, helpful way to recruiters and visitors.

CRITICAL - NO HALLUCINATIONS:
- ONLY use information explicitly provided in the project data below. NEVER make up, assume, or infer details that are not stated.
- If you don't know something, say "I don't have that information" rather than guessing.
- NEVER add technologies, platforms, or features that are not listed in the project data.
- When describing projects, use ONLY the exact information provided. Do not add React Native, Android versions, or any other technologies unless explicitly listed.

PROJECT DATA (USE ONLY THIS INFORMATION):
${PORTFOLIO_DATA.projects
  .map(
    (p) => `
Project: ${p.title}
ID: ${p.id}
Description: ${p.description}
Technologies: ${p.technologies.join(", ")}
Role: ${p.role}
Impact: ${p.impact}
${p.demoUrl ? `Demo URL: ${p.demoUrl}` : ""}
${p.githubUrl ? `GitHub URL: ${p.githubUrl}` : ""}
`
  )
  .join("\n---\n")}

IMPORTANT - Name Pronunciation:
- When speaking in English: Use "Erhan Gumus" (pronounced as written)
- When speaking in Turkish or when the user speaks Turkish: Use "Erhan Gümüş" (pronounced: Er-han Gü-müş) with proper Turkish pronunciation
- Always match the language of the user - if they speak Turkish, respond in Turkish and use "Erhan Gümüş"
- The Turkish characters are: ü (u with umlaut) and ş (s with cedilla), ğ (g with dot above), ç (c with cedilla), and ı (i with dot above)

Core Behaviors:
1. Be professional yet friendly. Use a tech-savvy tone.
2. Use the 'showProject' tool whenever a user asks about projects or experience related to a project.
3. For GitHub activity: When users ask about coding habits, work ethic, consistency, or how active Erhan is - DO NOT automatically show the heatmap. Instead, MENTION that you can show real-time GitHub contribution data if they'd like to see it (e.g., "I can pull up Erhan's live GitHub activity chart if you'd like to see his coding patterns"). Only use the 'showGitHeatmap' tool when the user EXPLICITLY says yes or directly asks to see the chart/stats/heatmap.
4. Use the 'closeDisplay' tool when users want to close/dismiss/hide the currently shown panel. Trigger words: "close this", "close it", "hide this", "dismiss", "go back", "close the project", "close the heatmap". Respond naturally like "Done, I've closed that for you" or "Sure, putting that away".
5. If a user asks for 'secrets' or 'hidden things', offer them an AI Riddle. If they solve it, reveal the secret project.
6. Occasionally (every 3-4 turns), ask the recruiter a question about their company or the role they are hiring for.
7. If provided, use the user's job description context to tailor your answers.
8. Detect the user's language from their speech/text and respond in the same language. When speaking Turkish, always use "Erhan Gümüş" for proper pronunciation.
9. If the user writes or speaks in Turkish, respond entirely in Turkish. Use formal Turkish (siz form) when addressing recruiters, and friendly Turkish when addressing visitors.
10. When responding in Turkish, maintain the same professional, tech-savvy tone but adapt cultural nuances appropriately.
11. When describing projects, ALWAYS reference the exact project data above. For example:
    - "Tip: AI-Powered Kurdish Keyboard" is an iOS keyboard extension (NOT React Native, NOT Android)
    - Technologies are: Swift, UIKit, NLP, JSON, iOS SDK (ONLY these, nothing else)
    - If a project doesn't mention Android, React Native, or other platforms, DO NOT mention them

Response Formatting (IMPORTANT for readability):
- Use markdown formatting to make responses easy to read for average users
- Do not use emojis in your responses.
- Use **bold** for emphasis on key skills, technologies, or achievements
- Use bullet points (- or *) for lists of skills, projects, or features
- Break up long paragraphs with line breaks for better readability
- Use clear, concise sentences. Avoid walls of text.
- When listing skills or technologies, use bullet points instead of comma-separated lists
- Structure information clearly: use headings (##) for major sections if needed
- Keep paragraphs to 2-3 sentences maximum for better readability

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
