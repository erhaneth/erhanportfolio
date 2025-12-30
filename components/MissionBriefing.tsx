import React, { useState, useEffect, useMemo } from "react";
import { PORTFOLIO_DATA } from "../constants";
import { Project } from "../types";
import { generateMissionPitch } from "../services/geminiService";

interface MissionBriefingProps {
  jobDescription: string;
  onProjectSelect: (project: Project) => void;
  onClose: () => void;
}

interface SkillMatch {
  skill: string;
  found: boolean;
  context?: string;
  projectMatches: string[];
}

interface BriefingData {
  fitScore: number;
  matchedSkills: SkillMatch[];
  unmatchedSkills: SkillMatch[];
  relevantProjects: Project[];
  generatedPitch: string;
  keyHighlights: string[];
  roleType: string;
}

// Tech keywords to look for in job descriptions
const TECH_KEYWORDS: Record<string, string[]> = {
  React: ["react", "reactjs", "react.js", "jsx", "hooks", "context api"],
  TypeScript: ["typescript", "ts", "type-safe", "strongly typed"],
  JavaScript: ["javascript", "js", "es6", "ecmascript", "node"],
  Python: ["python", "django", "flask", "fastapi"],
  "AI/ML": [
    "ai",
    "machine learning",
    "ml",
    "artificial intelligence",
    "llm",
    "gpt",
    "neural",
    "deep learning",
  ],
  "API Development": ["api", "rest", "graphql", "endpoint", "backend"],
  Cloud: ["aws", "azure", "gcp", "cloud", "serverless", "lambda"],
  Database: ["sql", "nosql", "mongodb", "postgres", "database", "redis"],
  DevOps: ["ci/cd", "docker", "kubernetes", "deployment", "devops"],
  Testing: ["testing", "jest", "cypress", "unit test", "tdd"],
  Mobile: ["mobile", "ios", "android", "react native", "flutter"],
  "UI/UX": ["ui", "ux", "design", "figma", "user experience", "frontend"],
  Agile: ["agile", "scrum", "sprint", "jira", "kanban"],
  Leadership: ["lead", "mentor", "team", "manage", "senior", "principal"],
};

// Erhan's actual skills (from resume)
const ERHAN_SKILLS: Record<string, { level: number; evidence: string }> = {
  React: {
    level: 90,
    evidence:
      "3 years building production React apps including 8by8 and portfolio projects",
  },
  TypeScript: {
    level: 88,
    evidence:
      "Primary language for React/Next.js projects, used at 8by8 and Code the Dream",
  },
  JavaScript: {
    level: 92,
    evidence: "3+ years experience, ES6+ expert, refactored legacy codebases",
  },
  Python: { level: 70, evidence: "Used for backend and AI/ML integrations" },
  "AI/ML": {
    level: 75,
    evidence:
      "Integrated OpenAI APIs for AI interview assistant with real-time feedback",
  },
  "API Development": {
    level: 85,
    evidence: "RESTful APIs, optimized API call efficiency at 8by8",
  },
  Cloud: {
    level: 80,
    evidence: "Heroku, Google Cloud, Vercel deployments for production apps",
  },
  Database: {
    level: 80,
    evidence: "PostgreSQL, MongoDB, MySQL - built museum app with PostgreSQL",
  },
  "UI/UX": {
    level: 82,
    evidence:
      "Collaborated with UX/UI designers, built intuitive customer-facing features",
  },
  Testing: {
    level: 85,
    evidence:
      "Playwright E2E testing, Jest unit tests, improved application stability",
  },
  DevOps: {
    level: 75,
    evidence: "CI/CD pipelines, Heroku/Vercel continuous deployment",
  },
  Agile: {
    level: 80,
    evidence: "Agile methodologies, Jira, sprint-based development",
  },
  Leadership: {
    level: 70,
    evidence: "Built internal platform for team of 4, mentored apprentices",
  },
};

function analyzeJobDescription(jd: string): BriefingData {
  const jdLower = jd.toLowerCase();
  const matchedSkills: SkillMatch[] = [];
  const unmatchedSkills: SkillMatch[] = [];

  // Find skill matches
  Object.entries(TECH_KEYWORDS).forEach(([skill, keywords]) => {
    const foundKeyword = keywords.find((kw) => jdLower.includes(kw));
    const hasSkill = ERHAN_SKILLS[skill];

    if (foundKeyword) {
      // Extract context around the keyword
      const index = jdLower.indexOf(foundKeyword);
      const start = Math.max(0, index - 30);
      const end = Math.min(jd.length, index + foundKeyword.length + 30);
      const context = "..." + jd.substring(start, end).trim() + "...";

      // Find projects that use this skill
      const projectMatches = PORTFOLIO_DATA.projects
        .filter((p) =>
          p.technologies.some(
            (t) =>
              t.toLowerCase().includes(foundKeyword) ||
              keywords.some((kw) => t.toLowerCase().includes(kw))
          )
        )
        .map((p) => p.title);

      if (hasSkill) {
        matchedSkills.push({
          skill,
          found: true,
          context,
          projectMatches,
        });
      } else {
        unmatchedSkills.push({
          skill,
          found: false,
          context,
          projectMatches: [],
        });
      }
    }
  });

  // Calculate fit score
  const totalRequired = matchedSkills.length + unmatchedSkills.length;
  const fitScore =
    totalRequired > 0
      ? Math.round((matchedSkills.length / totalRequired) * 100)
      : 0;

  // Find relevant projects
  const relevantProjects = PORTFOLIO_DATA.projects.filter((project) => {
    const projectTech = project.technologies.join(" ").toLowerCase();
    return matchedSkills.some(
      (skill) =>
        skill.projectMatches.includes(project.title) ||
        TECH_KEYWORDS[skill.skill].some((kw) => projectTech.includes(kw))
    );
  });

  // Determine role type
  let roleType = "Software Engineer";
  if (jdLower.includes("frontend") || jdLower.includes("front-end"))
    roleType = "Frontend Engineer";
  if (jdLower.includes("fullstack") || jdLower.includes("full-stack"))
    roleType = "Full-Stack Engineer";
  if (jdLower.includes("senior") || jdLower.includes("sr."))
    roleType = "Senior " + roleType;
  if (jdLower.includes("lead") || jdLower.includes("principal"))
    roleType = "Lead " + roleType;
  if (jdLower.includes("ai") || jdLower.includes("ml"))
    roleType = "AI/ML " + roleType;

  // Generate key highlights
  const keyHighlights = matchedSkills.slice(0, 4).map((s) => {
    const skill = ERHAN_SKILLS[s.skill];
    return skill ? `${s.skill}: ${skill.evidence}` : s.skill;
  });

  // Generate pitch
  const topSkills = matchedSkills
    .slice(0, 3)
    .map((s) => s.skill)
    .join(", ");
  const generatedPitch = `With strong expertise in ${
    topSkills || "modern web technologies"
  }, I bring ${relevantProjects.length} directly relevant project${
    relevantProjects.length !== 1 ? "s" : ""
  } that demonstrate hands-on experience with your core requirements. My background combines technical depth with a focus on building user-centric, production-ready applications.`;

  return {
    fitScore,
    matchedSkills,
    unmatchedSkills,
    relevantProjects,
    generatedPitch,
    keyHighlights,
    roleType,
  };
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({
  jobDescription,
  onProjectSelect,
  onClose,
}) => {
  const [phase, setPhase] = useState<"analyzing" | "generating" | "complete">(
    "analyzing"
  );
  const [scanProgress, setScanProgress] = useState(0);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [aiPitch, setAiPitch] = useState<string>("");
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  // Analyze job description
  const analysis = useMemo(
    () => analyzeJobDescription(jobDescription),
    [jobDescription]
  );

  // Animate the analysis phase and generate AI pitch
  useEffect(() => {
    if (phase === "analyzing") {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase("generating");
            setBriefing(analysis);
            return 100;
          }
          return prev + 4;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase, analysis]);

  // Generate AI pitch after analysis completes
  useEffect(() => {
    if (phase === "generating" && briefing && !isGeneratingPitch) {
      setIsGeneratingPitch(true);

      const matchedSkillNames = briefing.matchedSkills.map((s) => s.skill);
      const projectNames = briefing.relevantProjects.map((p) => p.title);

      generateMissionPitch(
        jobDescription,
        matchedSkillNames,
        projectNames,
        briefing.fitScore
      )
        .then((pitch) => {
          setAiPitch(pitch);
          setPhase("complete");
          setIsGeneratingPitch(false);
        })
        .catch(() => {
          setAiPitch(
            "Erhan brings strong experience in the technologies you're looking for, with a proven track record of building production-ready AI applications."
          );
          setPhase("complete");
          setIsGeneratingPitch(false);
        });
    }
  }, [phase, briefing, jobDescription, isGeneratingPitch]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00FF41]";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "EXCELLENT MATCH";
    if (score >= 60) return "STRONG MATCH";
    if (score >= 40) return "PARTIAL MATCH";
    return "LIMITED MATCH";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Scan line */}
        {phase === "analyzing" && (
          <div
            className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF41] to-transparent"
            style={{
              top: `${scanProgress}%`,
              boxShadow: "0 0 30px #00FF41, 0 0 60px #00FF41",
              transition: "top 0.05s linear",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Corner decorations */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 border-[#00FF41]" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 border-[#00FF41]" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 border-[#00FF41]" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 border-[#00FF41]" />

        <div className="bg-[#0d0208] border border-[#00FF41]/50 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-[#0d0208] border-b border-[#003B00] p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    phase === "complete"
                      ? "bg-[#00FF41]"
                      : "bg-[#00FF41] animate-pulse"
                  } shadow-[0_0_10px_#00FF41]`}
                />
                <h2 className="text-lg font-bold text-[#00FF41] tracking-widest mono matrix-text-glow">
                  MISSION_BRIEFING
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#008F11] hover:text-[#00FF41] transition-colors text-sm mono"
              >
                [DISMISS]
              </button>
            </div>

            {phase === "analyzing" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-[#008F11] mb-1">
                  <span>ANALYZING MISSION PARAMETERS...</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full h-1 bg-[#003B00]">
                  <div
                    className="h-full bg-[#00FF41] transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Briefing Content */}
          {briefing && (phase === "complete" || phase === "generating") && (
            <div className="p-6 space-y-6 animate-fadeIn">
              {/* Fit Score */}
              <div className="text-center py-6 border border-[#003B00] bg-[#003B00]/10">
                <div className="text-[10px] text-[#008F11] uppercase tracking-widest mb-2">
                  COMPATIBILITY ANALYSIS
                </div>
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    briefing.fitScore
                  )} matrix-text-glow`}
                >
                  {briefing.fitScore}%
                </div>
                <div
                  className={`text-sm ${getScoreColor(briefing.fitScore)} mt-2`}
                >
                  {getScoreLabel(briefing.fitScore)}
                </div>
                <div className="text-[10px] text-[#008F11] mt-1">
                  Target Role: {briefing.roleType}
                </div>
              </div>

              {/* Skill Matrix */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Matched Skills */}
                <div className="border border-[#00FF41]/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#00FF41]" />
                    <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">
                      SKILLS_ALIGNED ({briefing.matchedSkills.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {briefing.matchedSkills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-[#00FF41]">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-[#003B00]">
                            <div
                              className="h-full bg-[#00FF41]"
                              style={{
                                width: `${
                                  ERHAN_SKILLS[skill.skill]?.level || 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-[#008F11] text-[10px] w-8">
                            {ERHAN_SKILLS[skill.skill]?.level || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {briefing.matchedSkills.length === 0 && (
                      <div className="text-[#003B00] text-xs italic">
                        No direct matches found
                      </div>
                    )}
                  </div>
                </div>

                {/* Unmatched Skills */}
                <div className="border border-red-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-500/50" />
                    <span className="text-[10px] text-red-400/70 uppercase tracking-widest font-bold">
                      GAPS_IDENTIFIED ({briefing.unmatchedSkills.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {briefing.unmatchedSkills.map((skill, i) => (
                      <div key={i} className="text-xs text-red-400/60">
                        {skill.skill}
                      </div>
                    ))}
                    {briefing.unmatchedSkills.length === 0 && (
                      <div className="text-[#00FF41] text-xs">
                        ✓ All requirements covered
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Why Erhan - AI Generated Pitch */}
              <div className="border border-[#00FF41]/30 p-4 bg-[#00FF41]/5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2 h-2 ${
                      phase === "generating"
                        ? "bg-[#00FF41] animate-pulse"
                        : "bg-[#00FF41]"
                    }`}
                  />
                  <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">
                    WHY_ERHAN
                  </span>
                  {phase === "generating" && (
                    <span className="text-[9px] text-[#008F11] animate-pulse ml-2">
                      [AI_GENERATING...]
                    </span>
                  )}
                </div>
                {phase === "generating" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00FF41] animate-ping" />
                    <span className="text-sm text-[#008F11] italic">
                      Generating personalized pitch...
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-[#00FF41] leading-relaxed">
                    "{aiPitch}"
                  </p>
                )}
              </div>

              {/* Relevant Projects */}
              {briefing.relevantProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#00FF41] animate-pulse" />
                    <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">
                      RELEVANT_MISSIONS ({briefing.relevantProjects.length})
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {briefing.relevantProjects.map((project, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onProjectSelect(project);
                          onClose();
                        }}
                        className="w-full text-left p-4 border border-[#003B00] hover:border-[#00FF41] transition-all group bg-[#0d0208] hover:bg-[#003B00]/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#00FF41] font-bold group-hover:matrix-text-glow">
                            {project.title}
                          </span>
                          <span className="text-[9px] text-[#003B00] group-hover:text-[#008F11]">
                            [VIEW_DETAILS]
                          </span>
                        </div>
                        <p className="text-[11px] text-[#008F11] line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.slice(0, 5).map((tech, j) => (
                            <span
                              key={j}
                              className={`text-[9px] px-1.5 py-0.5 border ${
                                briefing.matchedSkills.some((s) =>
                                  TECH_KEYWORDS[s.skill]?.some((kw) =>
                                    tech.toLowerCase().includes(kw)
                                  )
                                )
                                  ? "border-[#00FF41]/50 text-[#00FF41] bg-[#00FF41]/10"
                                  : "border-[#003B00] text-[#008F11]"
                              }`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Highlights */}
              {briefing.keyHighlights.length > 0 && (
                <div className="border-t border-[#003B00] pt-4">
                  <div className="text-[10px] text-[#008F11] uppercase tracking-widest mb-3">
                    KEY_HIGHLIGHTS
                  </div>
                  <ul className="space-y-2">
                    {briefing.keyHighlights.map((highlight, i) => (
                      <li
                        key={i}
                        className="text-xs text-[#00FF41] flex items-start gap-2"
                      >
                        <span className="text-[#008F11]">▸</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionBriefing;
