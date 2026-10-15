import type { Express } from "express";
import { createServer, type Server } from "http";
import { fetchGitHubUser, fetchGitHubRepos, validateGitHubUsername } from "./github-fetcher";

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub API proxy endpoint to avoid CORS issues during development
  app.get("/api/github/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      if (!validateGitHubUsername(username)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid GitHub username" 
        });
        return;
      }
      const data = await fetchGitHubUser(username);
      if (data === null) {
        res.status(500).json({ 
          success: false, 
          message: "Failed to fetch GitHub user data" 
        });
        return;
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch GitHub user data" 
      });
    }
  });

  app.get("/api/github/user/:username/repos", async (req, res) => {
    try {
      const { username } = req.params;
      if (!validateGitHubUsername(username)) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid GitHub username" 
        });
        return;
      }
      const data = await fetchGitHubRepos(username);
      if (data === null) {
        res.status(500).json({ 
          success: false, 
          message: "Failed to fetch GitHub repositories" 
        });
        return;
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch GitHub repositories" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
