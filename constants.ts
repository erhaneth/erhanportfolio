
import { PortfolioData } from './types';

export const PORTFOLIO_DATA: PortfolioData = {
  name: "Erhan Gumus",
  title: "Senior AI Engineer & Full-Stack Developer",
  about: "I specialize in building production-grade AI applications, focusing on Large Language Models, Computer Vision, and high-performance React architectures. My goal is to bridge the gap between complex research and delightful user experiences.",
  skills: [
    "Gemini API", "LangChain", "PyTorch", "React", "TypeScript", "Python", "Computer Vision", "RAG Systems"
  ],
  experience: [
    {
      company: "NeuralCraft Solutions",
      role: "Lead AI Engineer",
      period: "2021 - Present",
      highlights: [
        "Architected a multi-agent RAG system for enterprise document analysis.",
        "Optimized inference pipelines reducing latency by 45%.",
        "Led a team of 5 engineers to deliver high-scale vision models."
      ]
    },
    {
      company: "Visionary Labs",
      role: "Machine Learning Engineer",
      period: "2019 - 2021",
      highlights: [
        "Developed real-time object detection systems for autonomous warehouse robots.",
        "Implemented custom CNN architectures in PyTorch for specialized medical imaging."
      ]
    }
  ],
  projects: [
    {
      id: "cv-vision-pro",
      title: "VisionPro: Multi-Modal Surveillance",
      description: "A real-time computer vision system that combines object detection with natural language descriptions using Gemini 1.5 Pro.",
      technologies: ["PyTorch", "Gemini API", "React", "FastAPI"],
      role: "Lead Developer",
      imageUrl: "https://picsum.photos/seed/vision/800/450",
      codeSnippet: "import torch\nfrom PIL import Image\nmodel = torch.hub.load('ultralytics/yolov5', 'yolov5s')\nimg = Image.open('frame.jpg')\nresults = model(img)\nresults.print()",
      impact: "Used by 3 logistics firms to monitor safety compliance in real-time."
    },
    {
      id: "agentic-support",
      title: "Agentic Customer Support",
      description: "An autonomous customer service agent capable of tool-use, order tracking, and complex policy reasoning.",
      technologies: ["LangChain", "OpenAI", "Next.js", "Redis"],
      role: "System Architect",
      imageUrl: "https://picsum.photos/seed/agent/800/450",
      codeSnippet: "const agent = createReactAgent({\n  llm,\n  tools,\n  checkpoint: memory\n});",
      impact: "Reduced human support ticket volume by 60% for a Fortune 500 retailer."
    },
    {
      id: "secret-project-omega",
      title: "[CLASSIFIED] Project Omega",
      description: "A highly experimental brain-computer interface simulation using neuro-symbolic AI.",
      technologies: ["TensorFlow", "C++", "WebAssembly"],
      role: "Researcher",
      imageUrl: "https://picsum.photos/seed/secret/800/450",
      codeSnippet: "// Restricted access to source code",
      impact: "Won 'Innovation of the Year' at the 2023 NeuroTech Summit."
    }
  ]
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
- Skills: ${PORTFOLIO_DATA.skills.join(', ')}
- About: ${PORTFOLIO_DATA.about}
`;

export const RIDDLE_DATA = {
  question: "I have no body, but I have a voice. I can reason without a brain. I learn from everything but remember nothing without a prompt. What am I?",
  answer: "llm" // or language model
};
