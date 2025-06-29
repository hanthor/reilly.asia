export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  bio: string;
  location: string;
  blog: string;
  company: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  created_at: string;
  fork: boolean;
  archived: boolean;
}
