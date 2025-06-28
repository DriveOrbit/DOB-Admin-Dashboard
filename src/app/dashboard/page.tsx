'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { AlertDemo, SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from '@/components/ui/AlertDemo';
import { redirectToLogin } from '@/lib/utils/navigation';

// Function to get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// Function to get first name from full name
function getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
}

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [showAlerts, setShowAlerts] = useState(false);
    const [demoAlert, setDemoAlert] = useState<string | null>(null);

    useEffect(() => {
        console.log('Dashboard useEffect - Loading:', loading, 'User:', user);
        console.log('Auth token in localStorage:', localStorage.getItem('authToken'));
        console.log('User object details:', user ? {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        } : 'null');

        if (!loading && !user) {
            console.log('No user found, redirecting to login...');
            // Use the navigation utility for better redirect handling
            redirectToLogin('/dashboard');
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
                            <div className="text-gray-300">
                                <span className="text-sm">{getGreeting()},</span>
                                <span className="ml-1 font-medium">{getFirstName(user.fullName || user.email)}</span>
                            </div>
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                                {user.role}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="hover:bg-red-600 hover:border-red-600 transition-colors"
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
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {getGreeting()}, {getFirstName(user.fullName || user.email)}! 👋
                                </h1>
                                <p className="text-blue-100 text-lg">
                                    Welcome back to your DriveOrbit Admin Dashboard
                                </p>
                                <div className="mt-4 flex items-center space-x-4 text-sm text-blue-100">
                                    <span>🔐 Role: {user.role}</span>
                                    <span>📧 {user.email}</span>
                                    <span>🕒 {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">User Management</h3>
                                <span className="text-2xl">👥</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">Manage system users and permissions</p>
                            <Button variant="outline" size="sm" className="w-full">
                                Manage Users
                            </Button>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Analytics</h3>
                                <span className="text-2xl">📊</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">View system analytics and reports</p>
                            <Button variant="outline" size="sm" className="w-full">
                                View Analytics
                            </Button>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Alert Components</h3>
                                <span className="text-2xl">🚨</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">Test all HeroUI alert components</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setShowAlerts(!showAlerts)}
                            >
                                {showAlerts ? 'Hide Alerts' : 'Show All Alerts'}
                            </Button>
                        </div>
                    </div>

                    {/* Demo Alert Buttons */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Test Alert Components</h3>

                        {/* Email Debug Section */}
                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                            <h4 className="text-lg font-semibold text-white mb-2">Backend Authentication</h4>
                            <p className="text-gray-300 text-sm mb-2">
                                Authentication is handled directly by your DriveOrbit backend API.
                            </p>
                            <p className="text-gray-300 text-sm mb-2">
                                No Firebase required - simple email/password authentication.
                            </p>
                            <div className="text-xs text-gray-400">
                                Current user: {user.email} (Role: {user.role})
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Button
                                variant="outline"
                                onClick={() => setDemoAlert('success')}
                                className="border-green-500 hover:bg-green-500"
                            >
                                Success Alert
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDemoAlert('error')}
                                className="border-red-500 hover:bg-red-500"
                            >
                                Error Alert
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDemoAlert('warning')}
                                className="border-yellow-500 hover:bg-yellow-500"
                            >
                                Warning Alert
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDemoAlert('info')}
                                className="border-blue-500 hover:bg-blue-500"
                            >
                                Info Alert
                            </Button>
                        </div>

                        {/* Demo Alerts Display */}
                        <div className="space-y-4">
                            {demoAlert === 'success' && (
                                <SuccessAlert
                                    title="Operation Successful!"
                                    description="Your dashboard action was completed successfully."
                                    onClose={() => setDemoAlert(null)}
                                />
                            )}
                            {demoAlert === 'error' && (
                                <ErrorAlert
                                    title="Something went wrong!"
                                    description="An error occurred while processing your request."
                                    onClose={() => setDemoAlert(null)}
                                />
                            )}
                            {demoAlert === 'warning' && (
                                <WarningAlert
                                    title="Please be careful!"
                                    description="This action might have unintended consequences."
                                    onClose={() => setDemoAlert(null)}
                                />
                            )}
                            {demoAlert === 'info' && (
                                <InfoAlert
                                    title="Did you know?"
                                    description="You can customize these alerts with different colors and messages."
                                    onClose={() => setDemoAlert(null)}
                                />
                            )}
                        </div>
                    </div>

                    {/* All Alerts Demo */}
                    {showAlerts && (
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <AlertDemo />
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-white mb-4">Quick Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">0</div>
                                <div className="text-sm text-gray-400">Total Users</div>
                            </div>
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-green-400">0</div>
                                <div className="text-sm text-gray-400">Active Sessions</div>
                            </div>
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-purple-400">0</div>
                                <div className="text-sm text-gray-400">Reports</div>
                            </div>
                            <div className="text-center p-4 bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-400">Online</div>
                                <div className="text-sm text-gray-400">System Status</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
