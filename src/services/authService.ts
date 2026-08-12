import { User, UserRole } from '../types';

const TOKEN_KEY = 'smarthospital_auth_token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, rememberMe = true): void {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  async login(credentials: { email?: string; username?: string; password?: string; rememberMe?: boolean }): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }

    this.setToken(data.token, credentials.rememberMe ?? true);
    return data;
  },

  async demoLogin(role: UserRole, rememberMe = true): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to perform demo login');
    }

    this.setToken(data.token, rememberMe);
    return data;
  },

  async register(registrationData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    role?: UserRole;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account');
    }

    this.setToken(data.token, true);
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        this.clearToken();
        return null;
      }

      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // Ignore network errors during logout
      }
    }
    this.clearToken();
  },

  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  },

  async createStaffAccount(staffData: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    departmentName?: string;
    roomNumber?: string;
    phone?: string;
  }): Promise<{ message: string; user: User }> {
    const token = this.getToken();
    const res = await fetch('/api/auth/admin/create-staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(staffData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create staff account');
    }

    return data;
  }
};
