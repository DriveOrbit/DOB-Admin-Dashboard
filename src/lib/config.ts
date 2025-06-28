export const config = {
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
        endpoints: {
            auth: {
                signup: '/api/admin/auth/signup',
                login: '/api/admin/auth/login',
                profile: '/api/admin/auth/profile'
            }
        }
    }
} as const;
