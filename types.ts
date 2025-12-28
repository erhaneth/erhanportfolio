
export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  demoUrl?: string;
  githubUrl?: string;
  imageUrl: string;
  codeSnippet?: string;
  impact?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'project' | 'riddle';
  metadata?: any;
}

export interface PortfolioData {
  name: string;
  title: string;
  about: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }[];
  projects: Project[];
}
