// Utility function to handle post-login navigation
export function handlePostLoginRedirect() {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
        // Get the intended destination from URL params or default to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/dashboard';

        // Use replace instead of push to prevent back button issues
        window.location.replace(redirectTo);
    }
}

// Function to redirect to login with current page as return URL
export function redirectToLogin(currentPath?: string) {
    if (typeof window !== 'undefined') {
        const returnUrl = currentPath || window.location.pathname;
        const loginUrl = `/auth/login${returnUrl !== '/auth/login' ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`;
        window.location.replace(loginUrl);
    }
}
