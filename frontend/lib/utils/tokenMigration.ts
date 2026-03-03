/**
 * Migration utility to move existing localStorage tokens to cookies
 * This should run once when the app loads to maintain user sessions
 */

import { authCookies } from "./cookies";

/**
 * Migrate tokens from localStorage to cookies
 * This ensures users don't get logged out when we switch storage methods
 */
export function migrateTokensToCookies(): void {
  if (typeof window === "undefined") return; // SSR guard

  try {
    // Check for existing tokens in localStorage with various possible key names
    const possibleTokenKeys = ["authToken", "auth_token", "accessToken"];
    const possibleRefreshTokenKeys = ["refreshToken", "refresh_token"];

    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    // Try to find access token
    for (const key of possibleTokenKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        accessToken = token;
        break;
      }
    }

    // Try to find refresh token
    for (const key of possibleRefreshTokenKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        refreshToken = token;
        break;
      }
    }

    // Migrate tokens if found
    if (accessToken) {
      console.log("Migrating access token from localStorage to cookies");
      authCookies.setAccessToken(accessToken);

      // Clean up old localStorage entries
      possibleTokenKeys.forEach((key) => localStorage.removeItem(key));
    }

    if (refreshToken) {
      console.log("Migrating refresh token from localStorage to cookies");
      authCookies.setRefreshToken(refreshToken);

      // Clean up old localStorage entries
      possibleRefreshTokenKeys.forEach((key) => localStorage.removeItem(key));
    }

    if (accessToken || refreshToken) {
      console.log("Token migration completed successfully");
    }
  } catch (error) {
    console.error("Error during token migration:", error);
    // Don't throw error, just log it to avoid breaking the app
  }
}

/**
 * Check if migration is needed (tokens exist in localStorage but not cookies)
 */
export function isMigrationNeeded(): boolean {
  if (typeof window === "undefined") return false; // SSR guard

  const hasTokensInCookies =
    !!authCookies.getAccessToken() || !!authCookies.getRefreshToken();

  if (hasTokensInCookies) {
    return false; // Already migrated or using cookies
  }

  const possibleTokenKeys = [
    "authToken",
    "auth_token",
    "accessToken",
    "refreshToken",
    "refresh_token",
  ];

  return possibleTokenKeys.some((key) => !!localStorage.getItem(key));
}
