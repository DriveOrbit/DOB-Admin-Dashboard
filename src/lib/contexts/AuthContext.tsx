'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (email: string, password: string, fullName: string, role?: string) => Promise<boolean>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            console.log('AuthContext: Initializing authentication...');
            try {
                if (authService.isAuthenticated()) {
                    console.log('AuthContext: Found auth token, fetching profile...');
                    const profile = await authService.getProfile();
                    console.log('AuthContext: Profile fetched:', profile);
                    setUser(profile);
                } else {
                    console.log('AuthContext: No auth token found');
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                console.log('AuthContext: Initialization complete, setting loading to false');
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            console.log('AuthContext: Starting login...');
            const response = await authService.login({ email, password });
            console.log('AuthContext: Login response:', response);

            if (response.success) {
                // If user object is provided, use it; otherwise try to fetch profile
                if (response.user) {
                    console.log('AuthContext: Setting user from login response:', response.user);
                    setUser(response.user);
                } else if (authService.isAuthenticated()) {
                    // Try to fetch user profile after successful login
                    console.log('AuthContext: Fetching user profile after login');
                    const profile = await authService.getProfile();
                    console.log('AuthContext: Profile fetch result:', profile);
                    if (profile) {
                        console.log('AuthContext: Setting user from profile fetch');
                        setUser(profile);
                    } else {
                        console.log('AuthContext: No profile returned, creating minimal user');
                        // Create a minimal user object if profile fetch fails
                        setUser({
                            id: 'temp',
                            email: email,
                            fullName: email.split('@')[0],
                            role: 'admin'
                        });
                    }
                } else {
                    console.log('AuthContext: Not authenticated after login, creating minimal user');
                    // Fallback: create minimal user object
                    setUser({
                        id: 'temp',
                        email: email,
                        fullName: email.split('@')[0],
                        role: 'admin'
                    });
                }
                console.log('AuthContext: Login successful, user set');
                return true;
            } else {
                console.log('AuthContext: Login failed -', response.message);
                setError(response.message || 'Login failed');
                return false;
            }
        } catch (error) {
            console.error('Login error in AuthContext:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string, fullName: string, role: string = 'admin'): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await authService.signup({ email, password, fullName, role });

            if (response.success) {
                return true;
            } else {
                setError(response.message || 'Signup failed');
                return false;
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        error,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
