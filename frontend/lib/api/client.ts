import {
  ApiResponse,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types/api";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      credentials: "include", // Send HttpOnly auth cookies automatically
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add in-memory token as Authorization header for backward compatibility
    // (useful when cookies are not available, e.g. non-browser environments)
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

      // Handle endpoints that may legitimately return no content (e.g., 204).
      const text = await response.text();
      if (!text) {
        // No body to parse; return an ApiResponse with undefined data.
        return { data: undefined as T } as ApiResponse<T>;
      }

      const data = JSON.parse(text) as ApiResponse<T>;
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
      credentials: "include", // Receive HttpOnly cookies set by the server
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

    // Keep access token in memory so the Authorization header can be sent
    // for clients that need it (e.g., non-browser environments).
    if (authData.accessToken) {
      this.token = authData.accessToken;
    }

    return authData;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/register`;

    const response = await fetch(url, {
      method: "POST",
      credentials: "include", // Receive HttpOnly cookies set by the server
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

    if (authData.accessToken) {
      this.token = authData.accessToken;
    }

    return authData;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>("/auth/me");
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const url = `${this.baseUrl}/auth/refresh`;

    // The refresh token is stored as an HttpOnly cookie and is automatically
    // included by the browser via credentials: 'include'.
    const response = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Token refresh failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const authData: AuthResponse = await response.json();

    if (authData.accessToken) {
      this.token = authData.accessToken;
    }

    return authData;
  }

  logout(): void {
    const token = this.token;
    this.token = null;
    // Fire-and-forget: ask the server to clear HttpOnly auth cookies.
    // Errors here are non-fatal — the in-memory token is already cleared.
    fetch(`${this.baseUrl}/auth/logout`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(() => {/* ignore */});
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
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
