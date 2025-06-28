'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DriversPage() {
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
                <h1 className="text-2xl font-bold text-white mb-2">Driver Management</h1>
                <p className="text-gray-400">Manage and monitor your drivers</p>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">JS</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">John Smith</h3>
                            <p className="text-gray-400 text-sm">Driver ID: D001</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">License:</span>
                            <span className="text-white">DL123456789</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vehicle:</span>
                            <span className="text-white">Toyota Camry</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Experience:</span>
                            <span className="text-white">5 years</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
                            Active
                        </span>
                        <div className="text-right">
                            <p className="text-white font-semibold">4.8</p>
                            <p className="text-gray-400 text-xs">Rating</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">SJ</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Sarah Johnson</h3>
                            <p className="text-gray-400 text-sm">Driver ID: D002</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">License:</span>
                            <span className="text-white">DL987654321</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vehicle:</span>
                            <span className="text-white">Honda Accord</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Experience:</span>
                            <span className="text-white">3 years</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs">
                            On Break
                        </span>
                        <div className="text-right">
                            <p className="text-white font-semibold">4.6</p>
                            <p className="text-gray-400 text-xs">Rating</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">MB</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Mike Brown</h3>
                            <p className="text-gray-400 text-sm">Driver ID: D003</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">License:</span>
                            <span className="text-white">DL456789123</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vehicle:</span>
                            <span className="text-white">Ford Explorer</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Experience:</span>
                            <span className="text-white">7 years</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
                            Active
                        </span>
                        <div className="text-right">
                            <p className="text-white font-semibold">4.9</p>
                            <p className="text-gray-400 text-xs">Rating</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
