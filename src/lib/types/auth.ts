export interface LoginRequest {
    idToken: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    fullName: string;
    role: string;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
}
