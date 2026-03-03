/**
 * Cookie utility functions for secure token storage
 */

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // in seconds
  path?: string;
}

const DEFAULT_OPTIONS: CookieOptions = {
  httpOnly: false, // Must be false for client-side access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/',
};

/**
 * Set a cookie with secure defaults
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return; // SSR guard

  const cookieOptions = { ...DEFAULT_OPTIONS, ...options };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (cookieOptions.maxAge) {
    cookieString += `; max-age=${cookieOptions.maxAge}`;
  }

  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`;
  }

  if (cookieOptions.secure) {
    cookieString += '; secure';
  }

  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // SSR guard

  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(`${encodedName}=`)) {
      return decodeURIComponent(cookie.substring(encodedName.length + 1));
    }
  }

  return null;
}

/**
 * Remove a cookie by setting it to expire immediately
 */
export function removeCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return; // SSR guard

  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=${path}`;
}

/**
 * Check if cookies are enabled/supported
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false; // SSR guard

  try {
    const testCookie = 'test_cookie_support';
    setCookie(testCookie, 'test', { maxAge: 1 });
    const isEnabled = getCookie(testCookie) === 'test';
    removeCookie(testCookie);
    return isEnabled;
  } catch {
    return false;
  }
}

// Specific cookie names for auth tokens
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

/**
 * Auth-specific cookie utilities
 */
export const authCookies = {
  setAccessToken: (token: string) => {
    setCookie(AUTH_COOKIES.ACCESS_TOKEN, token, {
      maxAge: 15 * 60, // 15 minutes for access token
    });
  },

  setRefreshToken: (token: string) => {
    setCookie(AUTH_COOKIES.REFRESH_TOKEN, token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
    });
  },

  getAccessToken: () => getCookie(AUTH_COOKIES.ACCESS_TOKEN),

  getRefreshToken: () => getCookie(AUTH_COOKIES.REFRESH_TOKEN),

  clearAuthTokens: () => {
    removeCookie(AUTH_COOKIES.ACCESS_TOKEN);
    removeCookie(AUTH_COOKIES.REFRESH_TOKEN);
  },
};