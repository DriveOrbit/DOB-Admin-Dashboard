'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (idToken: string) => Promise<boolean>;
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
            try {
                if (authService.isAuthenticated()) {
                    const profile = await authService.getProfile();
                    setUser(profile);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (idToken: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await authService.login({ idToken });

            if (response.success && response.user) {
                setUser(response.user);
                return true;
            } else {
                setError(response.message || 'Login failed');
                return false;
            }
        } catch (error) {
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
