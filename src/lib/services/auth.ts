import { config } from '../config';
import { LoginRequest, SignupRequest, AuthResponse, User, LoginBackendRequest } from '../types/auth';
import { signInWithFirebase, signUpWithFirebase } from '../firebase';

class AuthService {
    private baseUrl = config.api.baseUrl;
    private endpoints = config.api.endpoints.auth;

    async signup(data: SignupRequest): Promise<AuthResponse> {
        try {
            console.log('Starting signup process...');

            // First, create user in Firebase
            const firebaseResult = await signUpWithFirebase(data.email, data.password);

            if (!firebaseResult.success) {
                return {
                    success: false,
                    message: firebaseResult.error || 'Firebase signup failed',
                };
            }

            console.log('Firebase signup successful, verifying with backend...');

            // Ensure we have the ID token
            if (!firebaseResult.idToken) {
                throw new Error('Failed to get Firebase ID token');
            }

            // Then verify with backend using Firebase ID token
            const response = await fetch(`${this.baseUrl}${this.endpoints.signup}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseResult.idToken}`,
                },
                body: JSON.stringify({
                    ...data,
                    idToken: firebaseResult.idToken,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Backend verification failed');
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
            console.error('Signup error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An error occurred during signup',
            };
        }
    }

    async login(data: LoginRequest): Promise<AuthResponse> {
        try {
            console.log('Starting login process...');

            // First, authenticate with Firebase
            const firebaseResult = await signInWithFirebase(data.email, data.password);

            if (!firebaseResult.success) {
                return {
                    success: false,
                    message: firebaseResult.error || 'Firebase authentication failed',
                };
            }

            console.log('Firebase login successful, verifying with backend...');

            // Ensure we have the ID token
            if (!firebaseResult.idToken) {
                throw new Error('Failed to get Firebase ID token');
            }

            // Then verify with backend using Firebase ID token
            const backendData: LoginBackendRequest = {
                idToken: firebaseResult.idToken,
            };

            const response = await fetch(`${this.baseUrl}${this.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseResult.idToken}`,
                },
                body: JSON.stringify(backendData),
            });

            const result = await response.json();
            console.log('Backend login response:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Backend verification failed');
            }

            // Store token in localStorage
            if (result.token) {
                localStorage.setItem('authToken', result.token);
                console.log('Auth token stored in localStorage');
            }

            console.log('Login successful, returning:', {
                success: true,
                user: result.user || null,
                token: result.token || null,
                message: result.message || 'Login successful'
            });

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            console.error('Login error:', error);
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
