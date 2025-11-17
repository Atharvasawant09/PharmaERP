export interface User {
  UserId: string;
  Email: string;
  PasswordHash: string;
  FullName: string | null;
  Role: 'Admin' | 'SalesAgent' | 'Manager';
  IsActive: boolean;
  CreatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}
