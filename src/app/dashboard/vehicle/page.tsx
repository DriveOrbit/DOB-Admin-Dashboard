'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import GoogleMap from '@/components/ui/GoogleMap';
import { config } from '@/lib/config';

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

export default function VehiclePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
    const [vehicleTrackingConnected, setVehicleTrackingConnected] = useState<boolean>(false);
    const [totalActiveVehicles, setTotalActiveVehicles] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const vehicleTrackingRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Only redirect to login if we're certain the user is not authenticated
        // Wait for loading to complete and ensure we don't have a token
        if (!loading && !user) {
            // Double-check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('Vehicle Page: No user and no token, redirecting to login');
                router.push('/auth/login');
            } else {
                console.log('Vehicle Page: No user but token exists, waiting for auth to initialize');
                // Give AuthContext more time to initialize
                setTimeout(() => {
                    if (!user) {
                        console.log('Vehicle Page: Still no user after waiting, redirecting to login');
                        router.push('/auth/login');
                    }
                }, 1000);
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            // Connect to vehicle locations stream
            const connectVehicleTracking = () => {
                try {
                    console.log('🚗 Vehicle Page - Attempting vehicle tracking SSE connection');

                    const vehicleEventSource = new EventSource(`${config.api.baseUrl}/api/vehicles/locations/stream`);
                    vehicleTrackingRef.current = vehicleEventSource;

                    vehicleEventSource.onopen = () => {
                        setVehicleTrackingConnected(true);
                        console.log('✅ Vehicle Page - Vehicle tracking SSE connected');
                    };

                    // Listen for vehicleLocationsUpdate event
                    vehicleEventSource.addEventListener('vehicleLocationsUpdate', (event) => {
                        try {
                            const data: VehicleSSEMessage = JSON.parse(event.data);
                            if (data && data.data && Array.isArray(data.data.vehicleLocations)) {
                                setVehicleLocations(data.data.vehicleLocations);
                                setTotalActiveVehicles(data.data.totalActiveVehicles || data.data.vehicleLocations.length);
                            }
                        } catch (err) {
                            console.error('❌ Vehicle Page - Error parsing vehicleLocationsUpdate message:', err);
                        }
                    });

                    vehicleEventSource.onerror = (error) => {
                        console.error('❌ Vehicle Page - Vehicle tracking SSE error:', error);
                        setVehicleTrackingConnected(false);
                        vehicleEventSource.close();

                        // Attempt to reconnect after 5 seconds
                        setTimeout(() => {
                            if (user) {
                                console.log('🔄 Vehicle Page - Attempting vehicle tracking SSE reconnect...');
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
                if (vehicleTrackingRef.current) {
                    vehicleTrackingRef.current.close();
                }
            };
        }
    }, [user]);

    const filteredVehicles = vehicleLocations.filter(vehicle => {
        const matchesSearch = vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.jobId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'started': return 'bg-green-500';
            case 'completed': return 'bg-blue-500';
            default: return 'bg-yellow-500';
        }
    };

    const getStatusText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

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
                <p className="text-gray-400">Manage and track your fleet vehicles in real-time</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Vehicles</p>
                            <div className="flex items-center space-x-2">
                                <p className="text-2xl font-bold text-white">{totalActiveVehicles || 248}</p>
                                {vehicleTrackingConnected && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live tracking"></div>
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
                            <p className="text-gray-400 text-sm">Active Vehicles</p>
                            <p className="text-2xl font-bold text-white">
                                {filteredVehicles.filter(v => v.status === 'started').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-green-500 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Offline Vehicles</p>
                            <p className="text-2xl font-bold text-white">
                                {248 - totalActiveVehicles}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-600/20 rounded-lg">
                            <div className="w-6 h-6 bg-gray-500 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Vehicle Map */}
            <div className="mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Live Vehicle Tracking</h2>
                            <p className="text-gray-400 text-sm">Real-time location of all fleet vehicles</p>
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

                    <div className="h-96 rounded-lg overflow-hidden">
                        <GoogleMap
                            className="h-full w-full"
                            vehicles={vehicleLocations}
                            showVehicles={vehicleTrackingConnected}
                        />
                    </div>
                </div>
            </div>

            {/* Vehicle Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Vehicle Fleet</h2>
                            <p className="text-gray-400 text-sm">
                                {filteredVehicles.length} vehicles found
                                {vehicleTrackingConnected && (
                                    <span className="ml-2 text-green-400">• Live tracking active</span>
                                )}
                            </p>
                        </div>

                        {/* Search and Filter */}
                        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="started">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/30">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Speed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Update</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => {
                                    const location = vehicle.currentLocation || vehicle.latestTrackingPoint;
                                    const lastUpdate = location?.timestamp ?
                                        new Date(location.timestamp.seconds * 1000) : null;

                                    return (
                                        <tr key={`${vehicle.vehicleId}-${vehicle.jobId}`} className="hover:bg-gray-700/30">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                                            <span className="text-white font-medium">
                                                                {vehicle.vehicleId}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">
                                                            Vehicle {vehicle.vehicleId}
                                                        </div>
                                                        {vehicle.trackingPointsCount && (
                                                            <div className="text-sm text-gray-400">
                                                                {vehicle.trackingPointsCount} tracking points
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white font-mono">
                                                    {vehicle.jobId.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(vehicle.status)}`}>
                                                    {getStatusText(vehicle.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {location ? (
                                                    <div>
                                                        <div>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">No location</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {vehicle.latestTrackingPoint?.speed !== null && vehicle.latestTrackingPoint?.speed !== undefined ?
                                                    `${vehicle.latestTrackingPoint.speed} km/h` :
                                                    <span className="text-gray-500">N/A</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {lastUpdate ? (
                                                    <div>
                                                        <div>{lastUpdate.toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-400">
                                                            {lastUpdate.toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button className="text-blue-400 hover:text-blue-300 mr-4">
                                                    View Details
                                                </button>
                                                <button className="text-green-400 hover:text-green-300">
                                                    Track
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="text-gray-400">
                                            {vehicleTrackingConnected ? (
                                                <div>
                                                    <div className="text-lg">No vehicles found</div>
                                                    <p className="mt-2">Try adjusting your search or filter criteria</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-lg">Connecting to vehicle tracking...</div>
                                                    <div className="mt-2 flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
