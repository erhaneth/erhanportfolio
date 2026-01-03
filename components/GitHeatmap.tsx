import React, { useState, useEffect, useMemo } from "react";
import {
  GitContributionData,
  generateMockContributionData,
  fetchGitHubContributions,
} from "../services/githubService";
import { useLanguage } from "../contexts/LanguageContext";

interface GitHeatmapProps {
  onClose?: () => void;
  githubUsername?: string; // Optional: if provided, will try to fetch real data
  // For now, we'll use mock data. Set GITHUB_USERNAME in .env for real data
}

const GitHeatmap: React.FC<GitHeatmapProps> = ({ onClose, githubUsername }) => {
  const { translate } = useLanguage();
  const [data, setData] = useState<GitContributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (githubUsername) {
          console.log(
            "[GitHeatmap] Loading data for username:",
            githubUsername
          );
          const fetchedData = await fetchGitHubContributions(githubUsername);
          if (fetchedData) {
            console.log("[GitHeatmap] Data loaded successfully");
            setData(fetchedData);
          } else {
            console.warn("[GitHeatmap] No data returned, using mock data");
            setData(generateMockContributionData());
          }
        } else {
          console.log("[GitHeatmap] No username provided, using mock data");
          // Use mock data for demo
          setData(generateMockContributionData());
        }
      } catch (error) {
        console.error("[GitHeatmap] Failed to load contribution data:", error);
        console.warn("[GitHeatmap] Falling back to mock data");
        setData(generateMockContributionData());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [githubUsername]);

  // Prepare calendar grid (53 weeks x 7 days)
  const calendarGrid = useMemo(() => {
    if (!data) return [];

    const grid: Array<Array<{ date: string; count: number; level: number }>> =
      [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 364); // 52 weeks * 7 days

    // Create a map of contributions by date
    const contributionMap = new Map(data.contributions.map((c) => [c.date, c]));

    // Start from the first day of the year (or 52 weeks ago)
    let currentDate = new Date(oneYearAgo);
    const startDayOfWeek = currentDate.getDay(); // 0 = Sunday

    // Fill in weeks
    for (let week = 0; week < 53; week++) {
      const weekData: Array<{ date: string; count: number; level: number }> =
        [];

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const contribution = contributionMap.get(dateStr);

        if (contribution) {
          weekData.push({
            date: dateStr,
            count: contribution.count,
            level: contribution.level,
          });
        } else {
          weekData.push({ date: dateStr, count: 0, level: 0 });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      grid.push(weekData);
    }

    return grid;
  }, [data]);

  const getIntensityColor = (level: number): string => {
    const colors = [
      "#161b22", // No contributions
      "#0e4429", // Level 1
      "#006d32", // Level 2
      "#26a641", // Level 3
      "#39d353", // Level 4
    ];
    return colors[level] || colors[0];
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="glass-terminal border border-[#00FF41] matrix-border-glow h-full w-full flex flex-col mono relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#00FF41] text-sm">
              Loading contribution data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const selectedDay = selectedDate
    ? data.contributions.find((c) => c.date === selectedDate)
    : null;

  return (
    <div className="glass-terminal border border-[#00FF41] matrix-border-glow h-full w-full flex flex-col mono relative overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00FF41] z-30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FF41] z-30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FF41] z-30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00FF41] z-30" />

      {/* Header */}
      <div className="bg-[#00FF41] px-3 sm:px-4 py-2 flex justify-between items-center gap-2 sm:gap-4">
        <span className="text-[8px] sm:text-[10px] font-bold text-[#0d0208] tracking-widest uppercase truncate flex-shrink">
          GIT_ACTIVITY_MATRIX
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#0d0208] hover:text-white font-bold transition-colors text-xs sm:text-sm flex-shrink-0"
          >
            {translate("project.terminate")}
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4 lg:p-6 pr-4 sm:pr-6 lg:pr-8 space-y-4 sm:space-y-6 lg:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
        {/* Contribution Heatmap */}
        <section>
          <h3 className="text-[#00FF41] text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[#00FF41]" />
            Contribution Calendar
          </h3>
          <div className="bg-[#020202]/50 border border-[#003B00] p-2 sm:p-3 lg:p-4 pr-3 sm:pr-4 lg:pr-6 overflow-x-auto">
            <div className="flex gap-0.5 sm:gap-1 items-start">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 sm:gap-1 mr-1 sm:mr-2 pt-5 sm:pt-6">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((day, i) => (
                  <div
                    key={i}
                    className="text-[7px] sm:text-[8px] text-[#008F11] h-2.5 sm:h-3 flex items-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex gap-0.5 sm:gap-1">
                {calendarGrid.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="flex flex-col gap-0.5 sm:gap-1"
                  >
                    {week.map((day, dayIndex) => {
                      const isSelected = selectedDate === day.date;
                      const isHovered = hoveredDate === day.date;
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "ring-2 ring-[#00FF41] scale-125 z-10"
                              : isHovered
                              ? "ring-1 ring-[#00FF41]/50 scale-110"
                              : ""
                          }`}
                          style={{
                            backgroundColor: getIntensityColor(day.level),
                          }}
                          onClick={() => setSelectedDate(day.date)}
                          onMouseEnter={() => setHoveredDate(day.date)}
                          onMouseLeave={() => setHoveredDate(null)}
                          title={`${formatDate(day.date)}: ${
                            day.count
                          } contributions`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-4 text-[7px] sm:text-[8px] text-[#008F11]">
              <span>Less</span>
              <div className="flex gap-0.5 sm:gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm"
                    style={{ backgroundColor: getIntensityColor(level) }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>

            {/* Selected day info */}
            {selectedDay && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#003B00]/30 border border-[#00FF41]/20">
                <div className="text-[#00FF41] text-[10px] sm:text-xs font-bold mb-1">
                  {formatDate(selectedDate!)}
                </div>
                <div className="text-[#008F11] text-[9px] sm:text-[10px]">
                  {selectedDay.count} contribution
                  {selectedDay.count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Language Breakdown */}
        <section>
          <h3 className="text-[#00FF41] text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[#00FF41]" />
            Language Distribution
          </h3>
          <div className="bg-[#020202]/50 border border-[#003B00] p-3 sm:p-4 pr-4 sm:pr-6 space-y-2 sm:space-y-3">
            {data.languages.map((lang, index) => (
              <div key={lang.language} className="group">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-[#00FF41] text-[10px] sm:text-xs font-bold truncate">
                      {lang.language}
                    </span>
                  </div>
                  <span className="text-[#008F11] text-[9px] sm:text-[10px] flex-shrink-0">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-[#003B00] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                      animationDelay: `${index * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Distribution */}
        <section>
          <h3 className="text-[#00FF41] text-xs sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[#00FF41]" />
            Project Distribution
          </h3>
          <div className="bg-[#020202]/50 border border-[#003B00] p-3 sm:p-4 pr-4 sm:pr-6 space-y-2 sm:space-y-3">
            {data.projects.map((project, index) => {
              const totalContributions = data.projects.reduce(
                (sum, p) => sum + p.contributions,
                0
              );
              const percentage =
                (project.contributions / totalContributions) * 100;
              return (
                <div key={project.name} className="group">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                      <span className="text-[#00FF41] text-[10px] sm:text-xs font-bold truncate">
                        {project.name}
                      </span>
                      <span className="text-[#008F11] text-[8px] sm:text-[9px] flex-shrink-0">
                        ({project.contributions} commits)
                      </span>
                    </div>
                    <span className="text-[#008F11] text-[9px] sm:text-[10px] flex-shrink-0">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#003B00] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00FF41] transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        animationDelay: `${index * 150}ms`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                    {project.languages.map((lang) => (
                      <span
                        key={lang}
                        className="text-[7px] sm:text-[8px] bg-[#003B00] px-1 sm:px-1.5 py-0.5 text-[#008F11] border border-[#003B00]"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GitHeatmap;
