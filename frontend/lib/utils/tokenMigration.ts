/**
 * Migration utility to clean up stale auth tokens that may have been stored
 * in localStorage by earlier versions of the app.
 *
 * Auth tokens are now managed as HttpOnly cookies set by the server and are
 * never stored in client-accessible storage.
 */

/**
 * Remove any auth tokens that were previously stored in localStorage.
 */
export function migrateTokensToCookies(): void {
  if (typeof window === "undefined") return; // SSR guard

  try {
    const staleKeys = [
      "authToken",
      "auth_token",
      "accessToken",
      "refreshToken",
      "refresh_token",
    ];
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error during token cleanup:", error);
  }
}

/**
 * Check if there are stale auth tokens sitting in localStorage that need
 * to be removed.
 */
export function isMigrationNeeded(): boolean {
  if (typeof window === "undefined") return false; // SSR guard

  const staleKeys = [
    "authToken",
    "auth_token",
    "accessToken",
    "refreshToken",
    "refresh_token",
  ];

  return staleKeys.some((key) => !!localStorage.getItem(key));
}
