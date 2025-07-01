import { config } from '../config';
import { LoginRequest, SignupRequest, AuthResponse, User, LoginBackendRequest } from '../types/auth';
import { signInWithFirebase, signUpWithFirebase } from '../firebase';

class AuthService {
    private baseUrl = config.api.baseUrl;
    private endpoints = config.api.endpoints.auth;

    async signup(data: SignupRequest): Promise<AuthResponse> {
        try {
            console.log('Starting signup process for:', data.email);

            // First, create user in Firebase to get ID token
            console.log('Creating Firebase user...');
            const firebaseResult = await signUpWithFirebase(data.email, data.password);

            if (!firebaseResult.success) {
                console.error('Firebase signup failed:', firebaseResult.error);
                let errorMessage = firebaseResult.error || 'Firebase signup failed';
                if (firebaseResult.error?.includes('EMAIL_EXISTS') || firebaseResult.error?.includes('email-already-in-use')) {
                    errorMessage = 'An account with this email address already exists. Please use a different email or try logging in instead.';
                }
                return {
                    success: false,
                    message: errorMessage,
                };
            }

            console.log('Firebase signup successful, registering with backend...');

            // Ensure we have the ID token
            if (!firebaseResult.idToken) {
                throw new Error('Failed to get Firebase ID token');
            }

            // For signup, send only the ID token (like login)
            // The user data will be extracted from the Firebase token by the backend
            const backendData = {
                idToken: firebaseResult.idToken
            };

            console.log('Sending to backend:', JSON.stringify(backendData, null, 2));

            // Register with backend using Firebase ID token
            const response = await fetch(`${this.baseUrl}${this.endpoints.signup}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseResult.idToken}`,
                },
                body: JSON.stringify(backendData),
            });

            console.log('Backend response status:', response.status);
            const result = await response.json();
            console.log('Backend response data:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Backend registration failed');
            }

            // Store token in localStorage if returned
            if (result.token) {
                localStorage.setItem('authToken', result.token);
                console.log('Auth token stored in localStorage');
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
            console.log('Starting login process for:', data.email);

            // First, authenticate with Firebase to get ID token
            console.log('Authenticating with Firebase...');
            const firebaseResult = await signInWithFirebase(data.email, data.password);

            if (!firebaseResult.success) {
                console.error('Firebase login failed:', firebaseResult.error);
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

            // Send ID token to backend for verification
            const backendData: LoginBackendRequest = {
                idToken: firebaseResult.idToken,
            };

            console.log('Sending ID token to backend for verification...');

            const response = await fetch(`${this.baseUrl}${this.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firebaseResult.idToken}`,
                },
                body: JSON.stringify(backendData),
            });

            console.log('Backend response status:', response.status);
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
            console.log('AuthService: Getting profile...');
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('AuthService: No auth token found');
                return null;
            }

            console.log('AuthService: Found token, making API request...');
            const response = await fetch(`${this.baseUrl}${this.endpoints.profile}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('AuthService: Profile API response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    // Token is invalid, remove it
                    console.log('AuthService: Token is invalid, removing from localStorage');
                    localStorage.removeItem('authToken');
                }
                throw new Error(`Failed to fetch profile: ${response.status}`);
            }

            const result = await response.json();
            console.log('AuthService: Profile API result:', result);
            return result.user || result;
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Don't remove token on network errors, only on 401
            if (error instanceof Error && error.message.includes('401')) {
                localStorage.removeItem('authToken');
            }
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
