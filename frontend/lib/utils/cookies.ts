/**
 * Generic cookie utility functions for non-sensitive, client-side state.
 *
 * NOTE: Any cookie written via document.cookie is readable by JavaScript and
 * is therefore vulnerable to theft through XSS attacks. Do NOT store auth
 * tokens or other sensitive credentials here. Auth tokens (access_token /
 * refresh_token) are managed by the backend as HttpOnly cookies that the
 * browser transmits automatically and that JavaScript cannot access.
 */

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // in seconds
  path?: string;
}

const DEFAULT_OPTIONS: CookieOptions = {
  httpOnly: false, // document.cookie is inherently client-side; HttpOnly is server-set only
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