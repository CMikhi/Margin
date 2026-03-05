// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  status?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  token_type: string;
  user?: User;
}

export interface User {
  id: string;
  username: string;
  role: string;
}

// Widget types
export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, any>;
  content?: string;
}

// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
}

export interface WeeklyBoard {
  id: string;
  title: string;
  tasks: Task[];
}

export interface CustomPage {
  id: string;
  title: string;
  path: string;
  createdAt: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  column: string;
  createdAt: string;
}
