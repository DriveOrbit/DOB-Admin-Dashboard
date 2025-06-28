import { config } from '../config';
import { LoginRequest, SignupRequest, AuthResponse, User } from '../types/auth';

class AuthService {
    private baseUrl = config.api.baseUrl;
    private endpoints = config.api.endpoints.auth;

    async signup(data: SignupRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.signup}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Signup failed');
            }

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An error occurred during signup',
            };
        }
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseUrl}${this.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            // Store token in localStorage
            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An error occurred during login',
            };
        }
    }

    async getProfile(): Promise<User | null> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.baseUrl}${this.endpoints.profile}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const result = await response.json();
            return result.user || result;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    logout(): void {
        localStorage.removeItem('authToken');
        window.location.href = '/auth/login';
    }

    getToken(): string | null {
        return localStorage.getItem('authToken');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export const authService = new AuthService();
