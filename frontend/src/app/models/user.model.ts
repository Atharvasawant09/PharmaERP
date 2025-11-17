export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
