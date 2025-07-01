'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import GoogleMap from '@/components/ui/GoogleMap';
import AvatarGroup from '@/components/ui/AvatarGroup';
import { config } from '@/lib/config';

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
    timestamp: number;
    type: string;
    activeDrivers: ActiveDriver[];
    activeCount: number;
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
                    console.log('🚀 Dashboard - Attempting SSE connection to:', `${config.api.baseUrl}/api/drivers/active/stream`);

                    // Check if we have auth token for potential auth requirements
                    const token = localStorage.getItem('authToken');
                    console.log('🔑 Dashboard - Auth token present:', !!token);

                    const eventSource = new EventSource(`${config.api.baseUrl}/api/drivers/active/stream`);
                    wsRef.current = eventSource;

                    eventSource.onopen = () => {
                        setWsConnected(true);
                        console.log('✅ Dashboard SSE connected for active drivers');
                        console.log('📡 Dashboard SSE URL:', `${config.api.baseUrl}/api/drivers/active/stream`);
                        console.log('📡 Dashboard SSE readyState:', eventSource.readyState);
                    };

                    // Listen for the correct 'activeDriversUpdate' event (this is the actual event from backend)
                    eventSource.addEventListener('activeDriversUpdate', (event) => {
                        try {
                            console.log('📨 Dashboard - Raw activeDriversUpdate event data:', event.data);
                            console.log('📨 Dashboard - Event type:', event.type);
                            console.log('📨 Dashboard - Full event object:', event);

                            const data: SSEMessage = JSON.parse(event.data);
                            console.log('📊 Dashboard - Parsed activeDriversUpdate data:', JSON.stringify(data, null, 2));

                            if (data && Array.isArray(data.activeDrivers)) {
                                console.log('✅ Dashboard - Setting activeDrivers:', data.activeDrivers.length, 'drivers');
                                console.log('✅ Dashboard - Setting activeCount:', data.activeCount || data.activeDrivers.length);

                                setActiveDrivers(prev => {
                                    console.log('🔄 Dashboard - Previous activeDrivers:', prev.length);
                                    console.log('🔄 Dashboard - New activeDrivers:', data.activeDrivers.length);
                                    return data.activeDrivers;
                                });

                                setActiveCount(prev => {
                                    const newCount = data.activeCount || data.activeDrivers.length;
                                    console.log('🔄 Dashboard - Previous activeCount:', prev);
                                    console.log('🔄 Dashboard - New activeCount:', newCount);
                                    return newCount;
                                });

                                console.log('📋 Dashboard - Active drivers data details:', data.activeDrivers.map(d => ({
                                    id: d.documentId,
                                    name: `${d.firstName} ${d.lastName || ''}`,
                                    status: d.status
                                })));
                            } else {
                                console.warn('⚠️ Dashboard - activeDriversUpdate data structure invalid:', data);
                                console.warn('⚠️ Dashboard - activeDrivers is array?', Array.isArray(data?.activeDrivers));
                                console.warn('⚠️ Dashboard - data exists?', !!data);
                            }
                        } catch (err) {
                            console.error('❌ Dashboard - Error parsing activeDriversUpdate message:', err);
                        }
                    });

                    // Listen for 'initial' event type 
                    eventSource.addEventListener('initial', (event) => {
                        try {
                            console.log('📨 Dashboard - Raw initial event data:', event.data);
                            const data: SSEMessage = JSON.parse(event.data);
                            console.log('📊 Dashboard - Parsed initial data:', data);

                            if (data && Array.isArray(data.activeDrivers)) {
                                setActiveDrivers(data.activeDrivers);
                                setActiveCount(data.activeCount || data.activeDrivers.length);
                                console.log('✅ Dashboard - Active drivers updated via initial:', data.activeCount || data.activeDrivers.length);
                                console.log('📋 Dashboard - Initial active drivers data:', data.activeDrivers);
                            }
                        } catch (err) {
                            console.error('❌ Dashboard - Error parsing initial message:', err);
                        }
                    });

                    // Also listen for default message events as fallback
                    eventSource.onmessage = (event) => {
                        try {
                            console.log('📨 Dashboard - Raw default message data:', event.data);
                            console.log('📨 Dashboard - Default event type:', event.type);
                            console.log('📨 Dashboard - Full default event object:', event);

                            const data: SSEMessage = JSON.parse(event.data);
                            console.log('📊 Dashboard - Parsed default message data:', JSON.stringify(data, null, 2));

                            if (data && Array.isArray(data.activeDrivers)) {
                                console.log('✅ Dashboard - Setting activeDrivers (default):', data.activeDrivers.length, 'drivers');

                                setActiveDrivers(prev => {
                                    console.log('🔄 Dashboard (default) - Previous activeDrivers:', prev.length);
                                    console.log('🔄 Dashboard (default) - New activeDrivers:', data.activeDrivers.length);
                                    return data.activeDrivers;
                                });

                                setActiveCount(prev => {
                                    const newCount = data.activeCount || data.activeDrivers.length;
                                    console.log('🔄 Dashboard (default) - Previous activeCount:', prev);
                                    console.log('🔄 Dashboard (default) - New activeCount:', newCount);
                                    return newCount;
                                });

                                console.log('✅ Dashboard - Active drivers updated (default):', data.activeCount || data.activeDrivers.length);
                            } else {
                                console.warn('⚠️ Dashboard - Default message data structure invalid:', data);
                                console.warn('⚠️ Dashboard - activeDrivers is array?', Array.isArray(data?.activeDrivers));
                                console.warn('⚠️ Dashboard - data exists?', !!data);
                            }
                        } catch (err) {
                            console.error('❌ Dashboard - Error parsing default SSE message:', err);
                        }
                    };

                    // Add a generic event listener to catch ALL events
                    const handleAllEvents = (event: any) => {
                        console.log('🎯 Dashboard - Caught event of type:', event.type);
                        console.log('🎯 Dashboard - Event data:', event.data);
                        console.log('🎯 Dashboard - Full event object:', event);

                        // Try to parse any event data
                        if (event.data && event.data !== '') {
                            try {
                                const parsedData = JSON.parse(event.data);
                                console.log('🎯 Dashboard - Parsed event data:', parsedData);

                                // Check if this looks like driver data regardless of event type
                                if (parsedData && (parsedData.activeDrivers || parsedData.drivers)) {
                                    console.log('🎯 Dashboard - Found driver data in', event.type, 'event');
                                    const drivers = parsedData.activeDrivers || parsedData.drivers || [];
                                    const count = parsedData.activeCount || parsedData.count || drivers.length;

                                    if (Array.isArray(drivers)) {
                                        console.log('🎯 Dashboard - Updating from generic event:', drivers.length, 'drivers');
                                        setActiveDrivers(drivers);
                                        setActiveCount(count);
                                    }
                                }
                            } catch (e) {
                                console.log('🎯 Dashboard - Non-JSON event data:', event.data);
                            }
                        }
                    };

                    // Listen to all possible event types including the correct one
                    ['message', 'activeDriversUpdate', 'driverUpdate', 'initial', 'data', 'update', 'ping', 'keepalive'].forEach(eventType => {
                        eventSource.addEventListener(eventType, handleAllEvents);
                    });

                    eventSource.onerror = (error) => {
                        console.error('❌ Dashboard SSE error:', error);
                        console.error('❌ Dashboard SSE readyState:', eventSource.readyState);
                        console.error('❌ Dashboard SSE url:', eventSource.url);

                        // ReadyState meanings: 0=CONNECTING, 1=OPEN, 2=CLOSED
                        const stateText = eventSource.readyState === 0 ? 'CONNECTING' :
                            eventSource.readyState === 1 ? 'OPEN' : 'CLOSED';
                        console.error('❌ Dashboard SSE state text:', stateText);

                        setWsConnected(false);
                        eventSource.close();

                        // Attempt to reconnect after 5 seconds
                        setTimeout(() => {
                            if (user) {
                                console.log('🔄 Dashboard - Attempting SSE reconnect...');
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

    // Debug: Track state changes
    useEffect(() => {
        console.log('🔄 Dashboard state updated:', {
            activeDriversCount: activeDrivers.length,
            activeCount: activeCount,
            wsConnected: wsConnected,
            driversData: activeDrivers
        });
    }, [activeDrivers, activeCount, wsConnected]);

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
                        <div className="flex items-center space-x-4">
                            {activeDrivers.length > 0 && (
                                <AvatarGroup drivers={activeDrivers} maxVisible={5} size="md" />
                            )}
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
                    </div>

                    {activeDrivers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeDrivers.map((driver) => (
                                <div key={driver.documentId} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                                    <div className="flex items-center space-x-3">
                                        {driver.profilePicture && driver.profilePicture.startsWith('http') ? (
                                            <img
                                                src={driver.profilePicture}
                                                alt={`${driver.firstName}'s profile`}
                                                className="w-10 h-10 rounded-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const fallback = target.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm ${driver.profilePicture && driver.profilePicture.startsWith('http') ? 'hidden' : ''}`}
                                            style={driver.profilePicture && driver.profilePicture.startsWith('http') ? { display: 'none' } : {}}
                                        >
                                            {driver.firstName.charAt(0).toUpperCase()}{driver.lastName ? driver.lastName.charAt(0).toUpperCase() : ''}
                                        </div>
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
