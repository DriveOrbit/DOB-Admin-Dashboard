'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OverviewPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
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
                <h1 className="text-2xl font-bold text-white mb-2">Overview</h1>
                <p className="text-gray-400">Get insights into your DriveOrbit system</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Vehicles</p>
                            <p className="text-2xl font-bold text-white">248</p>
                        </div>
                        <div className="p-3 bg-blue-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-blue-500 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active Drivers</p>
                            <p className="text-2xl font-bold text-white">156</p>
                        </div>
                        <div className="p-3 bg-green-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-green-500 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Revenue</p>
                            <p className="text-2xl font-bold text-white">$12,450</p>
                        </div>
                        <div className="p-3 bg-purple-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-purple-500 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Notifications</p>
                            <p className="text-2xl font-bold text-white">23</p>
                        </div>
                        <div className="p-3 bg-red-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-red-500 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">V</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium">New vehicle registered</p>
                            <p className="text-gray-400 text-sm">Toyota Camry - License: ABC-123</p>
                        </div>
                        <span className="text-gray-400 text-sm">2 hours ago</span>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">D</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium">Driver completed training</p>
                            <p className="text-gray-400 text-sm">John Smith - Advanced Safety Course</p>
                        </div>
                        <span className="text-gray-400 text-sm">4 hours ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
