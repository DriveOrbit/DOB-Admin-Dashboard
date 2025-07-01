'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotificationPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect to login if we're certain the user is not authenticated
        // Wait for loading to complete and ensure we don't have a token
        if (!loading && !user) {
            // Double-check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('Notification Page: No user and no token, redirecting to login');
                router.push('/auth/login');
            } else {
                console.log('Notification Page: No user but token exists, waiting for auth to initialize');
                // Give AuthContext more time to initialize
                setTimeout(() => {
                    if (!user) {
                        console.log('Notification Page: Still no user after waiting, redirecting to login');
                        router.push('/auth/login');
                    }
                }, 1000);
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
                <p className="text-gray-400">Stay updated with system alerts and messages</p>
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">Vehicle Maintenance Due</h3>
                                <span className="text-gray-400 text-sm">2 hours ago</span>
                            </div>
                            <p className="text-gray-300 mb-2">Honda Accord (XYZ-789) requires scheduled maintenance. Last service was 6 months ago.</p>
                            <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">High Priority</span>
                                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">Maintenance</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">New Driver Application</h3>
                                <span className="text-gray-400 text-sm">4 hours ago</span>
                            </div>
                            <p className="text-gray-300 mb-2">Emily Davis has submitted a new driver application for review.</p>
                            <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Medium Priority</span>
                                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">Application</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">System Update Completed</h3>
                                <span className="text-gray-400 text-sm">1 day ago</span>
                            </div>
                            <p className="text-gray-300 mb-2">DriveOrbit system has been successfully updated to version 2.1.0 with new features and security improvements.</p>
                            <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Low Priority</span>
                                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">System</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">Driver License Expiring</h3>
                                <span className="text-gray-400 text-sm">2 days ago</span>
                            </div>
                            <p className="text-gray-300 mb-2">John Smith's driver license will expire in 30 days. Please remind him to renew.</p>
                            <div className="flex space-x-2">
                                <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">Medium Priority</span>
                                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">License</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
