'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { config } from '@/lib/config';

interface ActiveDriver {
    profilePicture: string;
    firstName: string;
    lastName?: string;
    documentId: string;
    status: string;
    email?: string;
    phoneNumber?: string;
    licenseNumber?: string;
    licenseType?: string;
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

export default function DriversPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
    const [activeCount, setActiveCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        console.log('🚀 Setting up active drivers SSE connection...');
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let reconnectTimeout: NodeJS.Timeout;

        const connectSSE = () => {
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }

            try {
                const eventSource = new EventSource(`${config.api.baseUrl}/api/drivers/active/stream`);
                sseRef.current = eventSource;

                eventSource.onopen = () => {
                    console.log('✅ Active drivers SSE connection opened');
                    setIsConnected(true);
                    reconnectAttempts = 0;
                };

                // Listen for the correct 'activeDriversUpdate' event (this is the actual event from backend)
                eventSource.addEventListener('activeDriversUpdate', (event) => {
                    try {
                        console.log('📨 Raw activeDriversUpdate event data:', event.data);
                        const data: SSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed activeDriversUpdate data:', data);

                        if (data && Array.isArray(data.activeDrivers)) {
                            setActiveDrivers(data.activeDrivers);
                            setActiveCount(data.activeCount || data.activeDrivers.length);
                            console.log('✅ Active drivers updated via activeDriversUpdate:', data.activeCount || data.activeDrivers.length, 'drivers set in state');
                        } else {
                            console.warn('⚠️ activeDriversUpdate data structure invalid:', data);
                        }
                    } catch (err) {
                        console.error('❌ Error parsing activeDriversUpdate:', err);
                        console.error('Raw event data that failed:', event.data);
                    }
                });

                // Listen for 'initial' event type (based on your data)
                eventSource.addEventListener('initial', (event) => {
                    try {
                        console.log('📨 Raw initial event data:', event.data);
                        const data: SSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed initial data:', data);

                        if (data && Array.isArray(data.activeDrivers)) {
                            setActiveDrivers(data.activeDrivers);
                            setActiveCount(data.activeCount || data.activeDrivers.length);
                            console.log('✅ Active drivers updated via initial event:', data.activeCount || data.activeDrivers.length, 'drivers set in state');
                        }
                    } catch (err) {
                        console.error('❌ Error parsing initial event:', err);
                    }
                });

                // Also listen for default message events as fallback
                eventSource.onmessage = (event) => {
                    try {
                        console.log('📨 Raw default message data:', event.data);
                        const data: SSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed default message data:', data);

                        if (data && Array.isArray(data.activeDrivers)) {
                            setActiveDrivers(data.activeDrivers);
                            setActiveCount(data.activeCount || data.activeDrivers.length);
                            console.log('✅ Active drivers updated via default message:', data.activeCount || data.activeDrivers.length, 'drivers set in state');
                        } else {
                            console.warn('⚠️ Default message data structure invalid:', data);
                        }
                    } catch (err) {
                        console.error('❌ Error parsing default message:', err);
                        console.error('Raw event data that failed:', event.data);
                    }
                };

                // Add a generic event listener to catch ALL events  
                const handleAllEvents = (event: any) => {
                    console.log('🎯 Drivers - Caught event of type:', event.type);
                    console.log('🎯 Drivers - Event data:', event.data);
                    console.log('🎯 Drivers - Full event object:', event);

                    // Try to parse any event data
                    if (event.data && event.data !== '') {
                        try {
                            const parsedData = JSON.parse(event.data);
                            console.log('🎯 Drivers - Parsed event data:', parsedData);

                            // Check if this looks like driver data regardless of event type
                            if (parsedData && (parsedData.activeDrivers || parsedData.drivers)) {
                                console.log('🎯 Drivers - Found driver data in', event.type, 'event');
                                const drivers = parsedData.activeDrivers || parsedData.drivers || [];
                                const count = parsedData.activeCount || parsedData.count || drivers.length;

                                if (Array.isArray(drivers)) {
                                    console.log('🎯 Drivers - Updating from generic event:', drivers.length, 'drivers');
                                    setActiveDrivers(drivers);
                                    setActiveCount(count);
                                }
                            }
                        } catch (e) {
                            console.log('🎯 Drivers - Non-JSON event data:', event.data);
                        }
                    }
                };

                // Listen to all possible event types including the correct one
                ['message', 'activeDriversUpdate', 'driverUpdate', 'initial', 'data', 'update', 'ping', 'keepalive'].forEach(eventType => {
                    eventSource.addEventListener(eventType, handleAllEvents);
                });

                eventSource.onerror = (error) => {
                    console.error('❌ Active drivers SSE error:', error);
                    setIsConnected(false);
                    eventSource.close();
                    sseRef.current = null;

                    // Attempt to reconnect with exponential backoff
                    if (reconnectAttempts < maxReconnectAttempts && user) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                        reconnectAttempts++;
                        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                        reconnectTimeout = setTimeout(() => {
                            if (user) {
                                connectSSE();
                            }
                        }, delay);
                    }
                };

            } catch (error) {
                console.error('❌ Error creating SSE connection:', error);
                setIsConnected(false);
            }
        };

        connectSSE();

        return () => {
            console.log('🧹 Cleaning up drivers SSE connection');
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }
            setIsConnected(false);
        };
    }, [user]);

    // Filter drivers based on search and status
    const filteredDrivers = activeDrivers.filter(driver => {
        const matchesSearch = searchQuery === '' ||
            driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (driver.lastName && driver.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (driver.email && driver.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (driver.phoneNumber && driver.phoneNumber.includes(searchQuery)) ||
            driver.documentId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-600/20 text-green-400';
            case 'inactive':
                return 'bg-red-600/20 text-red-400';
            case 'on_break':
            case 'break':
                return 'bg-yellow-600/20 text-yellow-400';
            case 'suspended':
                return 'bg-orange-600/20 text-orange-400';
            default:
                return 'bg-gray-600/20 text-gray-400';
        }
    };

    const getGradientColors = (firstName: string) => {
        const colors = [
            'from-blue-500 to-purple-600',
            'from-green-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-pink-500 to-rose-600',
            'from-indigo-500 to-blue-600',
            'from-yellow-500 to-orange-600',
            'from-purple-500 to-indigo-600',
            'from-teal-500 to-cyan-600',
        ];

        const index = firstName.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const formatLastUpdate = (lastStatusUpdate?: { seconds: number; nanos: number }) => {
        if (!lastStatusUpdate) return 'Unknown';

        const date = new Date(lastStatusUpdate.seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    // Debug: Log state changes
    useEffect(() => {
        console.log('🔄 State updated - activeDrivers:', {
            count: activeDrivers.length,
            drivers: activeDrivers,
            activeCount: activeCount,
            isConnected: isConnected
        });
    }, [activeDrivers, activeCount, isConnected]);

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
                <h1 className="text-2xl font-bold text-white mb-2">Active Drivers</h1>
                <p className="text-gray-400">Monitor your currently active drivers</p>
            </div>

            {/* Debug Information */}
            <div className="mb-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <h3 className="text-white font-medium mb-2">🔍 Connection Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">SSE Status:</span>
                        <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? '✅ Connected' : '❌ Disconnected'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Total Active:</span>
                        <span className="text-white ml-2">{activeCount}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Drivers Loaded:</span>
                        <span className="text-white ml-2">{activeDrivers.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Filtered:</span>
                        <span className="text-white ml-2">{filteredDrivers.length}</span>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => {
                            console.log('🧪 Manual test data injection');
                            const testData = {
                                activeCount: 6,
                                timestamp: Date.now(),
                                activeDrivers: [
                                    {
                                        profilePicture: "https://avatars.githubusercontent.com/u/122157771?v=4",
                                        firstName: "Senuka",
                                        lastStatusUpdate: { seconds: 1744173239, nanos: 237000000 },
                                        documentId: "5jPz7cSB8hhSaTfoVZ0myvmOg6D3",
                                        status: "active"
                                    },
                                    {
                                        profilePicture: "https://avatars.githubusercontent.com/u/188667694?v=4",
                                        firstName: "Chandeera",
                                        documentId: "6xZoP2eFubebvfLfd1fjPpQH9Aa2",
                                        status: "active"
                                    }
                                ],
                                type: "test"
                            };
                            setActiveDrivers(testData.activeDrivers);
                            setActiveCount(testData.activeCount);
                            console.log('✅ Test data set:', testData);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                        Test Data
                    </button>
                    <button
                        onClick={() => {
                            console.log('🔄 Current state check:', {
                                activeDrivers,
                                activeCount,
                                isConnected,
                                filteredDrivers
                            });
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                        Log State
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search drivers by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on_break">On Break</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Drivers Grid */}
            {filteredDrivers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => (
                        <div
                            key={driver.documentId}
                            className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 hover:bg-gray-800/70 transition-all duration-200"
                        >
                            <div className="flex items-center space-x-4 mb-4">
                                {driver.profilePicture && driver.profilePicture.startsWith('http') ? (
                                    <img
                                        src={driver.profilePicture}
                                        alt={`${driver.firstName}'s profile`}
                                        className="w-12 h-12 rounded-full object-cover"
                                        onError={(e) => {
                                            // Fallback to gradient avatar if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-12 h-12 bg-gradient-to-r ${getGradientColors(driver.firstName)} rounded-full flex items-center justify-center text-white font-bold text-lg ${driver.profilePicture && driver.profilePicture.startsWith('http') ? 'hidden' : ''}`}
                                    style={driver.profilePicture && driver.profilePicture.startsWith('http') ? { display: 'none' } : {}}
                                >
                                    {driver.firstName.charAt(0).toUpperCase()}
                                    {driver.lastName ? driver.lastName.charAt(0).toUpperCase() : ''}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">
                                        {driver.firstName} {driver.lastName || ''}
                                    </h3>
                                    <p className="text-gray-400 text-sm">ID: {driver.documentId.substring(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {driver.email && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Email:</span>
                                        <span className="text-white text-sm truncate ml-2">{driver.email}</span>
                                    </div>
                                )}
                                {driver.phoneNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Phone:</span>
                                        <span className="text-white text-sm">{driver.phoneNumber}</span>
                                    </div>
                                )}
                                {driver.licenseNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">License:</span>
                                        <span className="text-white text-sm">{driver.licenseType} - {driver.licenseNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Last Update:</span>
                                    <span className="text-white text-sm">{formatLastUpdate(driver.lastStatusUpdate)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                                    {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                                </span>
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 text-xs">Live</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">
                        {activeDrivers.length === 0
                            ? (isConnected ? 'No active drivers found' : 'Connecting to server...')
                            : 'No drivers match your filters'
                        }
                    </div>
                    <p className="text-gray-500 text-sm">
                        {activeDrivers.length === 0
                            ? (isConnected ? 'All drivers are currently offline' : 'Waiting for SSE connection...')
                            : 'Try adjusting your search or filter criteria'
                        }
                    </p>
                    {!isConnected && (
                        <p className="text-red-400 text-sm mt-2">
                            Check browser console for detailed connection logs
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
