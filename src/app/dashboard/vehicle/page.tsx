'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VehiclePage() {
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
                <h1 className="text-2xl font-bold text-white mb-2">Vehicle Management</h1>
                <p className="text-gray-400">Manage your fleet vehicles</p>
            </div>

            {/* Vehicle Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                    <h2 className="text-xl font-semibold text-white">Vehicle Fleet</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/30">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">License Plate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Maintenance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            <tr className="hover:bg-gray-700/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-white font-semibold text-sm">TC</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">Toyota Camry</div>
                                            <div className="text-sm text-gray-400">2023 Model</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">ABC-123</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">John Smith</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Dec 15, 2024</td>
                            </tr>

                            <tr className="hover:bg-gray-700/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-white font-semibold text-sm">HA</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">Honda Accord</div>
                                            <div className="text-sm text-gray-400">2022 Model</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">XYZ-789</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Sarah Johnson</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Maintenance
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Dec 10, 2024</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
