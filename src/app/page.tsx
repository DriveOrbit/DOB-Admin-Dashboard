'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        console.log('Home page - Auth state changed:', { user: !!user, loading, userObject: user });

        if (!loading) {
            if (user) {
                console.log('Home page - User found, redirecting to dashboard');
                router.push('/dashboard');
            } else {
                console.log('Home page - No user, redirecting to login');
                router.push('/auth/login');
            }
        } else {
            console.log('Home page - Still loading, waiting...');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    return null;
}
