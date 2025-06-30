'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import GoogleMap from '@/components/ui/GoogleMap';

interface ActiveDriver {
    profilePicture: string;
    firstName: string;
    lastName?: string;
    documentId: string;
    status: string;
    lastStatusUpdate?: {
        seconds: number;
        nanos: number;
    };
    [key: string]: any;
}

interface SSEMessage {
    activeCount: number;
    type: string;
    activeDrivers: ActiveDriver[];
    timestamp: number;
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
    const [activeCount, setActiveCount] = useState<number>(156);
    const [wsConnected, setWsConnected] = useState<boolean>(false);
    const wsRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Connect to SSE for real-time active drivers
        if (user) {
            const connectSSE = () => {
                try {
                    const eventSource = new EventSource('http://localhost:8080/api/drivers/active/stream');
                    wsRef.current = eventSource;

                    eventSource.onopen = () => {
                        setWsConnected(true);
                        console.log('SSE connected for active drivers');
                    };

                    // Listen for the specific 'driverUpdate' event
                    eventSource.addEventListener('driverUpdate', (event) => {
                        try {
                            const data: SSEMessage = JSON.parse(event.data);
                            if (data && Array.isArray(data.activeDrivers)) {
                                setActiveDrivers(data.activeDrivers);
                                setActiveCount(data.activeCount);
                                console.log('Active drivers updated:', data.activeCount);
                                console.log('Active drivers data:', data.activeDrivers);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE message:', err);
                        }
                    });

                    // Also listen for default message events as fallback
                    eventSource.onmessage = (event) => {
                        try {
                            const data: SSEMessage = JSON.parse(event.data);
                            if (data && Array.isArray(data.activeDrivers)) {
                                setActiveDrivers(data.activeDrivers);
                                setActiveCount(data.activeCount);
                                console.log('Active drivers updated (default):', data.activeCount);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE message:', err);
                        }
                    };

                    eventSource.onerror = (error) => {
                        console.error('SSE error:', error);
                        setWsConnected(false);
                        eventSource.close();

                        // Attempt to reconnect after 5 seconds
                        setTimeout(() => {
                            if (user) {
                                connectSSE();
                            }
                        }, 5000);
                    };

                } catch (error) {
                    console.error('Error creating SSE connection:', error);
                    setWsConnected(false);
                }
            };

            connectSSE();

            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                    Welcome to DriveOrbit Admin Dashboard
                </h1>
                <p className="text-gray-400">
                    Hello {user.fullName}, you are logged in as <span className="text-blue-400 font-semibold">{user.role}</span>
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                            <div className="flex items-center space-x-2">
                                <p className="text-2xl font-bold text-white">{activeCount}</p>
                                {wsConnected && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates"></div>
                                )}
                            </div>
                        </div>
                        <div className="p-3 bg-green-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-green-500 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Vehicles on the Way</p>
                            <p className="text-2xl font-bold text-white">42</p>
                        </div>
                        <div className="p-3 bg-orange-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-orange-500 rounded"></div>
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

            {/* Vehicle Tracking Map */}
            <div className="mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Live Vehicle Tracking</h2>
                            <p className="text-gray-400 text-sm">Real-time location of your fleet</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-sm">Live</span>
                        </div>
                    </div>

                    <div className="h-96 rounded-lg overflow-hidden">
                        <GoogleMap className="h-full w-full" />
                    </div>
                </div>
            </div>

            {/* Active Drivers List */}
            <div className="mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Active Drivers</h2>
                            <p className="text-gray-400 text-sm">Drivers currently online and available</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {wsConnected ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 text-sm">Live</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-red-400 text-sm">Offline</span>
                                </>
                            )}
                        </div>
                    </div>

                    {activeDrivers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeDrivers.map((driver) => (
                                <div key={driver.documentId} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={driver.profilePicture}
                                            alt={`${driver.firstName}'s profile`}
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/default-avatar.png';
                                            }}
                                        />
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium">
                                                {driver.firstName} {driver.lastName || ''}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-green-400 text-sm capitalize">{driver.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {driver.lastStatusUpdate && (
                                        <p className="text-gray-400 text-xs mt-2">
                                            Last update: {new Date(driver.lastStatusUpdate.seconds * 1000).toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-lg">No active drivers</div>
                            <p className="text-gray-500 text-sm mt-2">
                                {wsConnected ? 'All drivers are currently offline' : 'Connecting to real-time data...'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
