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
    // Repositories to fetch specifically
    const externalRepos = [
      "ublue-os/bluefin-lts",
      "almalinux/bootc-images",
      "tuna-os/tunaos"
    ];

    // Fetch user repos
    const userReposUrl = import.meta.env.DEV
      ? `/api/github/user/${GITHUB_USERNAME}/repos`
      : `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=50`;

    const userResponse = await fetch(userReposUrl);
    let allRepos: GitHubRepo[] = [];

    if (userResponse.ok) {
      allRepos = await userResponse.json();
    }

    // Fetch external repos
    const externalRepoPromises = externalRepos.map(async (repoName) => {
      const url = import.meta.env.DEV
        ? `/api/github/repos/${repoName}`
        : `https://api.github.com/repos/${repoName}`;

      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      return null;
    });

    const fetchedExternalRepos = (await Promise.all(externalRepoPromises)).filter(r => r !== null);

    // Combine arrays
    allRepos = [...allRepos, ...fetchedExternalRepos];

    return allRepos;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}
