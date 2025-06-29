import { GitHubUser, GitHubRepo } from "@/types/github";

const GITHUB_USERNAME = "hanthor";

export async function fetchGitHubUser(): Promise<GitHubUser | null> {
  try {
    // In development, use proxy. In production, call GitHub API directly
    const apiUrl = import.meta.env.DEV 
      ? `/api/github/user/${GITHUB_USERNAME}`
      : `https://api.github.com/users/${GITHUB_USERNAME}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch GitHub user");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub user:", error);
    return null;
  }
}

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    // In development, use proxy. In production, call GitHub API directly
    const apiUrl = import.meta.env.DEV 
      ? `/api/github/user/${GITHUB_USERNAME}/repos`
      : `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=50`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch GitHub repositories");
    }
    const repos = await response.json();
    
    // Filter and sort repos, prioritizing featured projects
    const featuredRepos = [
      "mautrix-wsproxy",
      "bluefin-lts", 
      "schildichat-android-next",
      "tunaOS"
    ];
    
    return repos
      .filter((repo: GitHubRepo) => !repo.fork && !repo.archived)
      .sort((a: GitHubRepo, b: GitHubRepo) => {
        const aIndex = featuredRepos.indexOf(a.name);
        const bIndex = featuredRepos.indexOf(b.name);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return b.stargazers_count - a.stargazers_count;
      });
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}
