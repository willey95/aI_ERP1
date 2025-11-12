export type UserRole = 'admin' | 'cfo' | 'team_lead' | 'rm_team' | 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: UserRole;
  position: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  department: string;
  role: UserRole;
  position: string;
  phoneNumber?: string;
}

export interface UpdateUserDto extends Partial<RegisterDto> {
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
