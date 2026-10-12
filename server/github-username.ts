/**
 * GitHub username validation utilities.
 * Enforces GitHub's username constraints to prevent abuse and clarify acceptable input.
 */

/**
 * Regex for validating GitHub usernames.
 * 
 * GitHub username rules:
 * - 1-39 characters
 * - Alphanumerics and hyphens only
 * - Cannot start or end with hyphen
 * - Case-insensitive
 */
export const GITHUB_USERNAME_REGEX = /^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$/i;

/**
 * Validate a GitHub username against GitHub's constraints.
 * 
 * @param username - The username to validate
 * @returns true if valid, false otherwise
 */
export function isValidGitHubUsername(username: string): boolean {
  return GITHUB_USERNAME_REGEX.test(username);
}
