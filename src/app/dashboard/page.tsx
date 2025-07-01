'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import GoogleMap from '@/components/ui/GoogleMap';
import AvatarGroup from '@/components/ui/AvatarGroup';
import { config } from '@/lib/config';

// Add animations
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

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

interface VehicleLocation {
    jobId: string;
    vehicleId: string;
    status: string;
    latestTrackingPoint?: {
        latitude: number;
        longitude: number;
        speed?: number | null;
        format: string;
        timestamp: {
            seconds: number;
            nanos: number;
        };
    };
    currentLocation?: {
        latitude: number;
        longitude: number;
        format: string;
        timestamp: any;
    };
    trackingPointsCount?: number;
}

interface VehicleSSEMessage {
    type: string;
    timestamp: number;
    message?: string;
    data?: {
        vehiclesWithLocation: number;
        vehicleLocations: VehicleLocation[];
        totalActiveVehicles: number;
        timestamp: number;
    };
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
    const [activeCount, setActiveCount] = useState<number>(156);
    const [wsConnected, setWsConnected] = useState<boolean>(false);
    const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
    const [vehicleTrackingConnected, setVehicleTrackingConnected] = useState<boolean>(false);
    const [totalActiveVehicles, setTotalActiveVehicles] = useState<number>(0);

    // Pagination state for active drivers
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [driversPerPage] = useState<number>(12); // Show 12 drivers per page
    const [showAllDrivers, setShowAllDrivers] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<'compact' | 'normal'>('normal'); // Grid size toggle
    const [initialDisplayCount] = useState<number>(6); // Show 6 drivers initially
    const [visibleDriversCount, setVisibleDriversCount] = useState<number>(6); // Current visible count

    const wsRef = useRef<EventSource | null>(null);
    const vehicleTrackingRef = useRef<EventSource | null>(null);

    // Calculate pagination with useMemo for performance
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(activeDrivers.length / driversPerPage);
        const startIndex = (currentPage - 1) * driversPerPage;
        const endIndex = startIndex + driversPerPage;

        let paginatedDrivers;
        if (showAllDrivers) {
            // Show all drivers
            paginatedDrivers = activeDrivers;
        } else if (activeDrivers.length <= initialDisplayCount) {
            // If we have few drivers, show them all
            paginatedDrivers = activeDrivers;
        } else {
            // Use "See More" functionality for many drivers
            paginatedDrivers = activeDrivers.slice(0, visibleDriversCount);
        }

        return {
            totalPages,
            startIndex,
            endIndex,
            paginatedDrivers
        };
    }, [activeDrivers, currentPage, driversPerPage, showAllDrivers, visibleDriversCount, initialDisplayCount]);

    const { totalPages, startIndex, endIndex, paginatedDrivers } = paginationData;

    // Reset visible count when total drivers change significantly
    useEffect(() => {
        if (activeDrivers.length <= initialDisplayCount) {
            setVisibleDriversCount(activeDrivers.length);
        } else if (visibleDriversCount > activeDrivers.length) {
            setVisibleDriversCount(Math.min(initialDisplayCount, activeDrivers.length));
        }
    }, [activeDrivers.length, initialDisplayCount, visibleDriversCount]);

    useEffect(() => {
        // Only redirect to login if we're certain the user is not authenticated
        // Wait for loading to complete and ensure we don't have a token
        if (!loading && !user) {
            // Double-check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('Dashboard: No user and no token, redirecting to login');
                router.push('/auth/login');
            } else {
                console.log('Dashboard: No user but token exists, waiting for auth to initialize');
                // Give AuthContext more time to initialize
                setTimeout(() => {
                    if (!user) {
                        console.log('Dashboard: Still no user after waiting, redirecting to login');
                        router.push('/auth/login');
                    }
                }, 1000);
            }
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

            // Connect to vehicle locations stream
            const connectVehicleTracking = () => {
                try {
                    console.log('🚗 Dashboard - Attempting vehicle tracking SSE connection to:', `${config.api.baseUrl}/api/vehicles/locations/stream`);

                    const vehicleEventSource = new EventSource(`${config.api.baseUrl}/api/vehicles/locations/stream`);
                    vehicleTrackingRef.current = vehicleEventSource;

                    vehicleEventSource.onopen = () => {
                        setVehicleTrackingConnected(true);
                        console.log('✅ Dashboard - Vehicle tracking SSE connected');
                        console.log('📡 Dashboard - Vehicle tracking SSE URL:', `${config.api.baseUrl}/api/vehicles/locations/stream`);
                        console.log('📡 Dashboard - Vehicle tracking SSE readyState:', vehicleEventSource.readyState);
                    };

                    // Listen for connected event
                    vehicleEventSource.addEventListener('connected', (event) => {
                        try {
                            console.log('📨 Dashboard - Vehicle tracking connected event:', event.data);
                            const data = JSON.parse(event.data);
                            console.log('📊 Dashboard - Vehicle tracking connection data:', data);
                        } catch (err) {
                            console.error('❌ Dashboard - Error parsing vehicle tracking connected message:', err);
                        }
                    });

                    // Listen for vehicleLocationsUpdate event
                    vehicleEventSource.addEventListener('vehicleLocationsUpdate', (event) => {
                        try {
                            console.log('📨 Dashboard - Raw vehicleLocationsUpdate event data:', event.data);
                            const data: VehicleSSEMessage = JSON.parse(event.data);
                            console.log('📊 Dashboard - Parsed vehicleLocationsUpdate data:', JSON.stringify(data, null, 2));

                            if (data && data.data && Array.isArray(data.data.vehicleLocations)) {
                                console.log('✅ Dashboard - Setting vehicle locations:', data.data.vehicleLocations.length, 'vehicles');

                                setVehicleLocations(prev => {
                                    console.log('🔄 Dashboard - Previous vehicle locations:', prev.length);
                                    console.log('🔄 Dashboard - New vehicle locations:', data.data!.vehicleLocations.length);
                                    return data.data!.vehicleLocations;
                                });

                                setTotalActiveVehicles(data.data.totalActiveVehicles || data.data.vehicleLocations.length);

                                console.log('📋 Dashboard - Vehicle locations data details:', data.data.vehicleLocations.map(v => ({
                                    vehicleId: v.vehicleId,
                                    status: v.status,
                                    hasLocation: !!(v.currentLocation || v.latestTrackingPoint),
                                    location: v.currentLocation || v.latestTrackingPoint
                                })));
                            } else {
                                console.warn('⚠️ Dashboard - vehicleLocationsUpdate data structure invalid:', data);
                            }
                        } catch (err) {
                            console.error('❌ Dashboard - Error parsing vehicleLocationsUpdate message:', err);
                        }
                    });

                    // Generic event listener for vehicle tracking
                    const handleVehicleEvents = (event: any) => {
                        console.log('🎯 Dashboard - Vehicle tracking event of type:', event.type);
                        console.log('🎯 Dashboard - Vehicle tracking event data:', event.data);

                        if (event.data && event.data !== '') {
                            try {
                                const parsedData = JSON.parse(event.data);
                                console.log('🎯 Dashboard - Parsed vehicle tracking event data:', parsedData);

                                // Check if this is vehicle location data
                                if (parsedData && parsedData.data && parsedData.data.vehicleLocations) {
                                    console.log('🎯 Dashboard - Found vehicle location data in', event.type, 'event');
                                    setVehicleLocations(parsedData.data.vehicleLocations);
                                    setTotalActiveVehicles(parsedData.data.totalActiveVehicles || parsedData.data.vehicleLocations.length);
                                }
                            } catch (e) {
                                console.log('🎯 Dashboard - Non-JSON vehicle tracking event data:', event.data);
                            }
                        }
                    };

                    // Listen to vehicle tracking event types
                    ['message', 'vehicleLocationsUpdate', 'connected', 'data', 'update'].forEach(eventType => {
                        vehicleEventSource.addEventListener(eventType, handleVehicleEvents);
                    });

                    vehicleEventSource.onerror = (error) => {
                        console.error('❌ Dashboard - Vehicle tracking SSE error:', error);
                        console.error('❌ Dashboard - Vehicle tracking SSE readyState:', vehicleEventSource.readyState);
                        setVehicleTrackingConnected(false);
                        vehicleEventSource.close();

                        // Attempt to reconnect after 5 seconds
                        setTimeout(() => {
                            if (user) {
                                console.log('🔄 Dashboard - Attempting vehicle tracking SSE reconnect...');
                                connectVehicleTracking();
                            }
                        }, 5000);
                    };

                } catch (error) {
                    console.error('Error creating vehicle tracking SSE connection:', error);
                    setVehicleTrackingConnected(false);
                }
            };

            connectVehicleTracking();

            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
                if (vehicleTrackingRef.current) {
                    vehicleTrackingRef.current.close();
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
            driversData: activeDrivers,
            vehicleLocationsCount: vehicleLocations.length,
            vehicleTrackingConnected: vehicleTrackingConnected,
            totalActiveVehicles: totalActiveVehicles,
            vehicleLocationsData: vehicleLocations
        });
    }, [activeDrivers, activeCount, wsConnected, vehicleLocations, vehicleTrackingConnected, totalActiveVehicles]);

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
                            <div className="flex items-center space-x-2">
                                <p className="text-2xl font-bold text-white">{totalActiveVehicles || 248}</p>
                                {vehicleTrackingConnected && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Live tracking"></div>
                                )}
                            </div>
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
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">Active Vehicles:</span>
                                <span className="text-white font-medium">{totalActiveVehicles}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {vehicleTrackingConnected ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-400 text-sm">Live Tracking</span>
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

                    <div className="h-96 rounded-lg overflow-hidden">
                        <GoogleMap
                            className="h-full w-full"
                            vehicles={vehicleLocations}
                            showVehicles={vehicleTrackingConnected}
                        />
                    </div>
                </div>
            </div>

            {/* Active Drivers List */}
            <div className="mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Active Drivers</h2>
                            <p className="text-gray-400 text-sm">
                                Showing {showAllDrivers ? activeDrivers.length : Math.min(paginatedDrivers.length, driversPerPage)}
                                {' '}of {activeDrivers.length} drivers currently online
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {activeDrivers.length > 6 && (
                                <button
                                    onClick={() => setGridSize(gridSize === 'compact' ? 'normal' : 'compact')}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                                    title={gridSize === 'compact' ? 'Switch to normal view' : 'Switch to compact view'}
                                >
                                    {gridSize === 'compact' ? '⊞' : '⊠'}
                                </button>
                            )}
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

                    {/* Search and Quick Filters */}
                    {activeDrivers.length > 6 && (
                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search active drivers..."
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => {
                                        const searchTerm = e.target.value.toLowerCase();
                                        if (searchTerm) {
                                            // Filter drivers based on search term
                                            // You could implement this with additional state if needed
                                            console.log('Search term:', searchTerm);
                                        }
                                    }}
                                />
                            </div>
                            <select
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                    // Filter by driver status if needed
                                    console.log('Filter by:', e.target.value);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="on_break">On Break</option>
                            </select>
                        </div>
                    )}

                    {activeDrivers.length > 0 ? (
                        <div className="transition-all duration-500 ease-out">
                            <div className={`grid gap-4 transition-all duration-500 ease-out ${gridSize === 'compact'
                                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                }`}>
                                {paginatedDrivers.map((driver, index) => (
                                    <div
                                        key={driver.documentId}
                                        className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fadeIn"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                            animationFillMode: 'both'
                                        }}
                                    >
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

                                        {/* Quick Actions */}
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
                                                onClick={() => {
                                                    // Navigate to driver details
                                                    router.push(`/dashboard/drivers?id=${driver.documentId}`);
                                                }}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
                                                onClick={() => {
                                                    // Contact driver action
                                                    console.log('Contact driver:', driver.documentId);
                                                }}
                                            >
                                                Contact
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-lg">No active drivers</div>
                            <p className="text-gray-500 text-sm mt-2">
                                {wsConnected ? 'All drivers are currently offline' : 'Connecting to real-time data...'}
                            </p>
                        </div>
                    )}

                    {/* See More / Pagination Controls */}
                    {activeDrivers.length > initialDisplayCount && (
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            {/* Progress indicator */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
                                    <span>
                                        Showing {Math.min(paginatedDrivers.length, activeDrivers.length)} of {activeDrivers.length} active drivers
                                    </span>
                                    <span className="text-xs">
                                        {Math.round((paginatedDrivers.length / activeDrivers.length) * 100)}% loaded
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1">
                                    <div
                                        className="bg-blue-500 h-1 rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${Math.min((paginatedDrivers.length / activeDrivers.length) * 100, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {!showAllDrivers && visibleDriversCount < activeDrivers.length && (
                                    <button
                                        onClick={() => {
                                            const nextCount = Math.min(visibleDriversCount + initialDisplayCount, activeDrivers.length);
                                            setVisibleDriversCount(nextCount);
                                        }}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <span>See More Drivers</span>
                                            <span className="text-blue-200">({Math.min(initialDisplayCount, activeDrivers.length - visibleDriversCount)} more)</span>
                                        </div>
                                    </button>
                                )}

                                {visibleDriversCount >= activeDrivers.length && !showAllDrivers && (
                                    <button
                                        onClick={() => setVisibleDriversCount(initialDisplayCount)}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all duration-200"
                                    >
                                        Show Less
                                    </button>
                                )}

                                <button
                                    onClick={() => router.push('/dashboard/drivers')}
                                    className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                    <span>Manage All</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
