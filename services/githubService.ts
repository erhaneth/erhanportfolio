// GitHub API Service for fetching contribution data
// Note: For production, you'll need to set up GitHub API authentication

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no contributions, 4 = max
}

export interface LanguageStats {
  language: string;
  bytes: number;
  percentage: number;
  color?: string;
}

export interface ProjectStats {
  name: string;
  contributions: number;
  languages: string[];
  lastActive: string;
}

export interface GitContributionData {
  contributions: ContributionDay[];
  totalContributions: number;
  longestStreak: number;
  currentStreak: number;
  languages: LanguageStats[];
  projects: ProjectStats[];
  activityByHour: number[]; // 24-hour array showing activity per hour
  activityByDay: number[]; // 7-day array (0=Sunday, 6=Saturday)
}

// Language colors (GitHub's color scheme)
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#239120",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
  Ruby: "#701516",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  YAML: "#cb171e",
  JSON: "#292929",
  Markdown: "#083fa1",
  React: "#61dafb",
  Vue: "#4fc08d",
  Angular: "#dd0031",
};

// Mock data generator for development/demo
// Replace this with actual GitHub API calls in production
export const generateMockContributionData = (): GitContributionData => {
  const contributions: ContributionDay[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Generate contributions for the past year
  for (let i = 0; i < 365; i++) {
    const date = new Date(oneYearAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // Simulate realistic contribution patterns
    // More activity on weekdays, less on weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseChance = isWeekend ? 0.3 : 0.7;

    // Add some variation
    const random = Math.random();
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    if (random < baseChance) {
      count = Math.floor(Math.random() * 20) + 1;
      if (count < 3) level = 1;
      else if (count < 7) level = 2;
      else if (count < 12) level = 3;
      else level = 4;
    }

    contributions.push({ date: dateStr, count, level });
  }

  // Calculate streaks
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (const day of contributions) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak from today backwards
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Language statistics (based on portfolio skills)
  const languages: LanguageStats[] = [
    { language: "TypeScript", bytes: 450000, percentage: 35 },
    { language: "Python", bytes: 320000, percentage: 25 },
    { language: "JavaScript", bytes: 180000, percentage: 14 },
    { language: "React", bytes: 150000, percentage: 12 },
    { language: "CSS", bytes: 80000, percentage: 6 },
    { language: "Swift", bytes: 50000, percentage: 4 },
    { language: "Other", bytes: 40000, percentage: 3 },
  ].map((lang) => ({
    ...lang,
    color: LANGUAGE_COLORS[lang.language] || "#008F11",
  }));

  // Project statistics
  const projects: ProjectStats[] = [
    {
      name: "erhan-ai-portfolio",
      contributions: 245,
      languages: ["TypeScript", "React", "CSS"],
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      name: "tip-kurdish-keyboard",
      contributions: 189,
      languages: ["Swift", "Python"],
      lastActive: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      name: "locked-in",
      contributions: 156,
      languages: ["TypeScript", "React"],
      lastActive: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    {
      name: "other-projects",
      contributions: 312,
      languages: ["Python", "JavaScript", "TypeScript"],
      lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  ];

  // Activity by hour (24-hour array)
  // Simulate more activity during work hours (9 AM - 6 PM)
  const activityByHour = Array.from({ length: 24 }, (_, hour) => {
    if (hour >= 9 && hour <= 18) {
      return Math.floor(Math.random() * 30) + 10;
    } else if (hour >= 19 && hour <= 22) {
      return Math.floor(Math.random() * 15) + 5;
    } else {
      return Math.floor(Math.random() * 5);
    }
  });

  // Activity by day of week (0=Sunday, 6=Saturday)
  const activityByDay = [5, 25, 30, 28, 32, 35, 12]; // More on weekdays

  const totalContributions = contributions.reduce(
    (sum, day) => sum + day.count,
    0
  );

  return {
    contributions,
    totalContributions,
    longestStreak,
    currentStreak,
    languages,
    projects,
    activityByHour,
    activityByDay,
  };
};

// Real GitHub API integration (for production)
// Fetches data from Netlify function which proxies GitHub API
export const fetchGitHubContributions = async (
  username: string
): Promise<GitContributionData | null> => {
  try {
    // Use Netlify function to fetch data (keeps token secure)
    // In development, use localhost if running netlify dev
    // In production, Netlify functions are at root
    const isDev =
      typeof window !== "undefined" && window.location.hostname === "localhost";
    const baseUrl = isDev ? "http://localhost:8888" : "";

    const url = `${baseUrl}/.netlify/functions/github-contributions?username=${username}`;
    console.log("[GitHub Service] Fetching from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GitHub Service] API error:", response.status, errorText);
      throw new Error(
        `GitHub API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check if we got an error response
    if (data.error) {
      console.error("[GitHub Service] Function returned error:", data.error);
      throw new Error(data.error);
    }

    console.log("[GitHub Service] Successfully fetched data:", {
      contributions: data.contributions?.length,
      projects: data.projects?.length,
      languages: data.languages?.length,
    });

    // Transform to our format
    const result: GitContributionData = {
      contributions: data.contributions.map((c: any) => ({
        date: c.date,
        count: c.count,
        level: c.level,
      })),
      totalContributions: data.totalContributions,
      longestStreak: data.longestStreak,
      currentStreak: data.currentStreak,
      languages: data.languages.map((lang: any) => ({
        language: lang.language,
        bytes: lang.bytes,
        percentage: lang.percentage,
        color: lang.color,
      })),
      projects: data.projects.map((proj: any) => ({
        name: proj.name,
        contributions: proj.contributions,
        languages: proj.languages,
        lastActive: proj.lastActive,
      })),
      activityByHour: data.activityByHour,
      activityByDay: data.activityByDay,
    };

    return result;
  } catch (error) {
    console.error("Failed to fetch GitHub contributions:", error);
    console.warn("Falling back to mock data");
    // Fallback to mock data if API fails
    return generateMockContributionData();
  }
};
