import {
  ApiResponse,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types/api";
import { authCookies } from "../utils/cookies";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    // Load token from cookies if available
    this.refreshTokenFromCookies();
  }

  // Refresh the token from cookies (useful after migration or page reload)
  private refreshTokenFromCookies(): void {
    if (typeof window !== "undefined") {
      this.token = authCookies.getAccessToken();
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Network error" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/login`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const authData: AuthResponse = await response.json();

    // Store tokens in cookies
    if (authData.accessToken) {
      this.token = authData.accessToken;
      authCookies.setAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      authCookies.setRefreshToken(authData.refreshToken);
    }

    return authData;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/register`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Registration failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const authData: AuthResponse = await response.json();

    // Store tokens in cookies
    if (authData.accessToken) {
      this.token = authData.accessToken;
      authCookies.setAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      authCookies.setRefreshToken(authData.refreshToken);
    }

    return authData;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>("/auth/me");
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = authCookies.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const url = `${this.baseUrl}/auth/refresh`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Token refresh failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const authData: AuthResponse = await response.json();

    // Update stored tokens in cookies
    if (authData.accessToken) {
      this.token = authData.accessToken;
      authCookies.setAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      authCookies.setRefreshToken(authData.refreshToken);
    }

    return authData;
  }

  logout(): void {
    this.token = null;
    authCookies.clearAuthTokens();
  }

  // Widget Methods
  async getWidgets() {
    const response = await this.request("/widgets");
    return response.data;
  }

  async updateWidgets(widgets: any[]) {
    const response = await this.request("/widgets", {
      method: "PUT",
      body: JSON.stringify({ widgets }),
    });
    return response.data;
  }

  // Notes Methods
  async getNotes(limit = 50, offset = 0) {
    const response = await this.request(
      `/notes?limit=${limit}&offset=${offset}`,
    );
    return response.data;
  }

  async createNote(noteData: any) {
    const response = await this.request("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    });
    return response.data;
  }

  async updateNote(id: string, noteData: any) {
    const response = await this.request(`/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(noteData),
    });
    return response.data;
  }

  async deleteNote(id: string) {
    await this.request(`/notes/${id}`, {
      method: "DELETE",
    });
  }

  // Calendar Methods
  async getCalendarEvents(start: string, end: string) {
    const response = await this.request(`/calendar?start=${start}&end=${end}`);
    return response.data;
  }

  async createCalendarEvent(eventData: any) {
    const response = await this.request("/calendar", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    return response.data;
  }

  async updateCalendarEvent(id: string, eventData: any) {
    const response = await this.request(`/calendar/${id}`, {
      method: "PATCH",
      body: JSON.stringify(eventData),
    });
    return response.data;
  }

  async deleteCalendarEvent(id: string) {
    await this.request(`/calendar/${id}`, {
      method: "DELETE",
    });
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Set token manually (for testing or external auth)
  setToken(token: string): void {
    this.token = token;
    authCookies.setAccessToken(token);
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Refresh token from cookies (useful after migration)
  refreshFromCookies(): void {
    this.refreshTokenFromCookies();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
