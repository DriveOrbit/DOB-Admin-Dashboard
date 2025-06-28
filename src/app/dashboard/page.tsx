'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navigation */}
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Logo size="md" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-gray-300">Welcome, {user.fullName}</span>
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                {user.role}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-600 rounded-lg h-96 p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Admin Dashboard
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Welcome to the DriveOrbit Admin Dashboard. You are logged in as {user.email}.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                                    <p className="text-gray-400 text-sm">Manage system users and permissions</p>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                                    <p className="text-gray-400 text-sm">View system analytics and reports</p>
                                </div>

                                <div className="bg-gray-800 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
                                    <p className="text-gray-400 text-sm">Configure system settings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
