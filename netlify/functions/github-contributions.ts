import { Handler } from "@netlify/functions";

// Netlify function to fetch GitHub contributions
// This keeps the GitHub token secure on the server side
export const handler: Handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const username = event.queryStringParameters?.username;
  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Username is required" }),
    };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "User-Agent": "erhan-ai-portfolio",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use GitHub GraphQL API to get contribution data
    const query = `
      query($username: String!, $userId: ID!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
          repositories(
            first: 100
            orderBy: { field: UPDATED_AT, direction: DESC }
            ownerAffiliations: OWNER
          ) {
            nodes {
              name
              languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
                edges {
                  size
                  node {
                    name
                    color
                  }
                }
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 1) {
                      nodes {
                        committedDate
                      }
                    }
                  }
                }
              }
              ref(qualifiedName: "HEAD") {
                target {
                  ... on Commit {
                    history(author: { id: $userId }) {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // First, get user ID
    const userQuery = `
      query($username: String!) {
        user(login: $username) {
          id
        }
      }
    `;
    
    const userResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: userQuery,
        variables: { username },
      }),
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("GitHub API error (user query):", errorText);
      return {
        statusCode: userResponse.status,
        body: JSON.stringify({
          error: "Failed to fetch GitHub user data",
          details: errorText,
        }),
      };
    }

    const userData = await userResponse.json();
    if (userData.errors || !userData.data?.user?.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "User not found or access denied",
          details: userData.errors,
        }),
      };
    }

    const userId = userData.data.user.id;

    // Now get full data with userId
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: { username, userId },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub API error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Failed to fetch GitHub data",
          details: errorText,
        }),
      };
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "GitHub API returned errors",
          details: data.errors,
        }),
      };
    }

    // Transform the data to our format
    const user = data.data.user;
    const calendar = user.contributionsCollection.contributionCalendar;

    // Transform weeks into flat array of days
    const contributions: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }> = [];

    calendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        const count = day.contributionCount;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0 && count < 3) level = 1;
        else if (count >= 3 && count < 7) level = 2;
        else if (count >= 7 && count < 12) level = 3;
        else if (count >= 12) level = 4;

        contributions.push({
          date: day.date,
          count,
          level,
        });
      });
    });

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
    const today = new Date().toISOString().split("T")[0];
    for (let i = contributions.length - 1; i >= 0; i--) {
      if (contributions[i].date <= today && contributions[i].count > 0) {
        currentStreak++;
      } else if (contributions[i].date <= today) {
        break;
      }
    }

    // Process repositories for project stats
    // We need to fetch commit counts per repository
    const projects = await Promise.all(
      user.repositories.nodes.map(async (repo: any) => {
        const languages = repo.languages.edges.map((edge: any) => edge.node.name);
        const lastCommit =
          repo.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate;
        const lastActive = lastCommit
          ? new Date(lastCommit).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        // Get commit count for this repository
        let commitCount = 0;
        if (repo.ref?.target?.history?.totalCount !== undefined) {
          commitCount = repo.ref.target.history.totalCount;
        } else if (repo.defaultBranchRef?.target) {
          // Try to get from defaultBranchRef if ref(HEAD) didn't work
          try {
            const commitQuery = `
              query($owner: String!, $repo: String!, $userId: ID!) {
                repository(owner: $owner, name: $repo) {
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(author: { id: $userId }) {
                          totalCount
                        }
                      }
                    }
                  }
                }
              }
            `;
            const commitResponse = await fetch("https://api.github.com/graphql", {
              method: "POST",
              headers,
              body: JSON.stringify({
                query: commitQuery,
                variables: {
                  owner: username,
                  repo: repo.name,
                  userId: userId,
                },
              }),
            });
            if (commitResponse.ok) {
              const commitData = await commitResponse.json();
              commitCount =
                commitData.data?.repository?.defaultBranchRef?.target?.history
                  ?.totalCount || 0;
            }
          } catch (err) {
            console.error(`Failed to get commit count for ${repo.name}:`, err);
          }
        } else {
          // Fallback: query commit count separately if not in initial query
          try {
            const commitQuery = `
              query($owner: String!, $repo: String!, $userId: ID!) {
                repository(owner: $owner, name: $repo) {
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(author: { id: $userId }) {
                          totalCount
                        }
                      }
                    }
                  }
                }
              }
            `;
            const commitResponse = await fetch("https://api.github.com/graphql", {
              method: "POST",
              headers,
              body: JSON.stringify({
                query: commitQuery,
                variables: {
                  owner: username,
                  repo: repo.name,
                  userId: userId,
                },
              }),
            });
            if (commitResponse.ok) {
              const commitData = await commitResponse.json();
              commitCount =
                commitData.data?.repository?.defaultBranchRef?.target?.history
                  ?.totalCount || 0;
            }
          } catch (err) {
            console.error(`Failed to get commit count for ${repo.name}:`, err);
          }
        }

        return {
          name: repo.name,
          contributions: commitCount,
          languages,
          lastActive,
        };
      })
    );

    // Calculate language statistics
    const languageMap = new Map<string, number>();
    user.repositories.nodes.forEach((repo: any) => {
      repo.languages.edges.forEach((edge: any) => {
        const langName = edge.node.name;
        const size = edge.size;
        languageMap.set(
          langName,
          (languageMap.get(langName) || 0) + size
        );
      });
    });

    const totalBytes = Array.from(languageMap.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    const languages = Array.from(languageMap.entries())
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: (bytes / totalBytes) * 100,
        color: getLanguageColor(language),
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10); // Top 10 languages

    // Activity by hour (we can't get this from GitHub API directly, so we'll use mock data)
    // For real hourly data, you'd need to query commit timestamps
    const activityByHour = Array.from({ length: 24 }, () => 0);

    // Activity by day of week (same limitation)
    const activityByDay = Array.from({ length: 7 }, () => 0);

    const result = {
      contributions,
      totalContributions: calendar.totalContributions,
      longestStreak,
      currentStreak,
      languages,
      projects: projects.slice(0, 10), // Top 10 projects
      activityByHour,
      activityByDay,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Error fetching GitHub data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};

// Helper function to get language colors (GitHub's color scheme)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
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
  return colors[language] || "#008F11";
}

