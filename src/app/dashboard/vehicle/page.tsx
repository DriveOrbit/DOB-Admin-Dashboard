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

interface VehicleRegistrationData {
    vehicleNumber: string;
    vehicleType: string;
    vehicleModel: string;
    vehicleImage: string;
    vehicleStatus: string;
    plateNumber: string;
    condition: string;
    fuelConsumption: number;
    recommendedDistance: number;
    warnings: string;
    fuelType: string;
    gearSystem: string;
    hasSpareTools: boolean;
    hasEmergencyKit: boolean;
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

    // Vehicle Registration Modal States
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registrationError, setRegistrationError] = useState('');
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [formData, setFormData] = useState<VehicleRegistrationData>({
        vehicleNumber: '',
        vehicleType: 'car',
        vehicleModel: '',
        vehicleImage: 'assets/car.png',
        vehicleStatus: 'Available',
        plateNumber: '',
        condition: 'good',
        fuelConsumption: 0,
        recommendedDistance: 0,
        warnings: 'None',
        fuelType: 'Petrol',
        gearSystem: 'Manual',
        hasSpareTools: true,
        hasEmergencyKit: true
    });

    useEffect(() => {
        // Only redirect to login if we're certain the user is not authenticated
        // Wait for loading to complete and ensure we don't have a token
        if (!loading && !user) {
            // Double-check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/auth/login');
            } else {
                // Give AuthContext more time to initialize
                setTimeout(() => {
                    if (!user) {
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
                    const vehicleEventSource = new EventSource(`${config.api.baseUrl}/api/vehicles/locations/stream`);
                    vehicleTrackingRef.current = vehicleEventSource;

                    vehicleEventSource.onopen = () => {
                        setVehicleTrackingConnected(true);
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

    // Handle vehicle type change to set appropriate image
    const handleVehicleTypeChange = (type: string) => {
        const vehicleImages: { [key: string]: string } = {
            'car': 'assets/car.png',
            'suv': 'assets/suv.png',
            'truck': 'assets/truck.png',
            'van': 'assets/van.png',
            'motorcycle': 'assets/motorcycle.png',
            'bus': 'assets/bus.png'
        };

        setFormData(prev => ({
            ...prev,
            vehicleType: type,
            vehicleImage: vehicleImages[type] || 'assets/car.png'
        }));
    };

    // Handle form input changes
    const handleInputChange = (field: keyof VehicleRegistrationData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Register vehicle API call
    const registerVehicle = async () => {
        setIsRegistering(true);
        setRegistrationError('');

        try {
            const response = await fetch(`${config.api.baseUrl}/vehicles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`Registration failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Extract QR code data from response
            if (result.qrCodeURL || result.qrCode || result.qrCodeData) {
                const qrCode = result.qrCodeURL || result.qrCode || result.qrCodeData;
                setQrCodeData(qrCode);
            } else {
                console.warn('No QR code found in response. Available fields:', Object.keys(result));
                setQrCodeData('');
            }

            setRegistrationSuccess(true);

        } catch (error) {
            console.error('Vehicle registration error:', error);
            setRegistrationError(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    // Download QR code as image
    const downloadQRCode = () => {
        if (!qrCodeData) return;

        try {
            let downloadUrl = qrCodeData;
            let filename = `vehicle-${formData.vehicleNumber}-qr.png`;

            // If qrCodeData is a base64 string, convert it to blob
            if (qrCodeData.startsWith('data:image/')) {
                // It's already a data URL, use it directly
                const link = document.createElement('a');
                link.href = qrCodeData;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // If it's a URL, fetch and download
            if (qrCodeData.startsWith('http')) {
                const link = document.createElement('a');
                link.href = qrCodeData;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // If it's base64 without data URL prefix, add it
            if (qrCodeData.match(/^[A-Za-z0-9+/=]+$/)) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${qrCodeData}`;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            console.error('Unknown QR code format:', qrCodeData);
            alert('QR code format not recognized. Please contact support.');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            alert('Failed to download QR code. Please try again.');
        }
    };

    // Close modal and reset states
    const closeModal = () => {
        setShowRegisterModal(false);
        setRegistrationSuccess(false);
        setRegistrationError('');
        setQrCodeData('');

        // Reset form data when closing modal
        setFormData({
            vehicleNumber: '',
            vehicleType: 'car',
            vehicleModel: '',
            vehicleImage: 'assets/car.png',
            vehicleStatus: 'Available',
            plateNumber: '',
            condition: 'good',
            fuelConsumption: 0,
            recommendedDistance: 0,
            warnings: 'None',
            fuelType: 'Petrol',
            gearSystem: 'Manual',
            hasSpareTools: true,
            hasEmergencyKit: true
        });
    };

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
                                <p className="text-2xl font-bold text-white">{totalActiveVehicles}</p>
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
                                {totalActiveVehicles > 0 ? Math.max(0, vehicleLocations.length - totalActiveVehicles) : 0}
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

                        {/* Search, Filter, and Register Button */}
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
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Register Vehicle</span>
                            </button>
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



            {showRegisterModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white">Register New Vehicle</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {registrationSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Vehicle Registered Successfully!</h3>
                                    <p className="text-gray-400 mb-6">Vehicle {formData.vehicleNumber} has been added to your fleet.</p>

                                    {qrCodeData ? (
                                        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                                            <h4 className="text-white font-medium mb-3">Vehicle QR Code</h4>
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="bg-white p-4 rounded-lg">
                                                    <img
                                                        src={qrCodeData.startsWith('data:') ? qrCodeData :
                                                            qrCodeData.startsWith('http') ? qrCodeData :
                                                                `data:image/png;base64,${qrCodeData}`}
                                                        alt="Vehicle QR Code"
                                                        className="w-32 h-32"
                                                        onError={(e) => {
                                                            console.error('QR code image failed to load:', qrCodeData);
                                                            e.currentTarget.style.display = 'none';
                                                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (errorDiv) {
                                                                errorDiv.style.display = 'block';
                                                            }
                                                        }}
                                                    />
                                                    <div className="text-center text-red-500 mt-2" style={{ display: 'none' }}>
                                                        QR Code format not supported for display
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={downloadQRCode}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>Download QR Code</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4 mb-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div>
                                                    <h4 className="text-yellow-300 font-medium">QR Code Pending</h4>
                                                    <p className="text-yellow-200 text-sm mt-1">The QR code for this vehicle will be generated shortly. You can access it later from the vehicle details.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={closeModal}
                                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); registerVehicle(); }} className="space-y-6">
                                    {/* Error Message */}
                                    {registrationError && (
                                        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-red-300">{registrationError}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Vehicle Number *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.vehicleNumber}
                                                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                placeholder="Enter vehicle number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Vehicle Type *
                                            </label>
                                            <select
                                                required
                                                value={formData.vehicleType}
                                                onChange={(e) => handleVehicleTypeChange(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="car">Car</option>
                                                <option value="suv">SUV</option>
                                                <option value="truck">Truck</option>
                                                <option value="van">Van</option>
                                                <option value="motorcycle">Motorcycle</option>
                                                <option value="bus">Bus</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Vehicle Model *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.vehicleModel}
                                                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                placeholder="Enter vehicle model"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Plate Number *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.plateNumber}
                                                onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                placeholder="Enter plate number"
                                            />
                                        </div>
                                    </div>

                                    {/* Vehicle Status and Condition */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Vehicle Status
                                            </label>
                                            <select
                                                value={formData.vehicleStatus}
                                                onChange={(e) => handleInputChange('vehicleStatus', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Condition
                                            </label>
                                            <select
                                                value={formData.condition}
                                                onChange={(e) => handleInputChange('condition', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="excellent">Excellent</option>
                                                <option value="good">Good</option>
                                                <option value="fair">Fair</option>
                                                <option value="poor">Poor</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Fuel and Performance */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fuel Type
                                            </label>
                                            <select
                                                value={formData.fuelType}
                                                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Electric">Electric</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="CNG">CNG</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Fuel Consumption (L/100km)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={formData.fuelConsumption}
                                                onChange={(e) => handleInputChange('fuelConsumption', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                placeholder="0.0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Recommended Distance (km)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.recommendedDistance}
                                                onChange={(e) => handleInputChange('recommendedDistance', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Gear System */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Gear System
                                        </label>
                                        <select
                                            value={formData.gearSystem}
                                            onChange={(e) => handleInputChange('gearSystem', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Manual">Manual</option>
                                            <option value="Automatic">Automatic</option>
                                            <option value="CVT">CVT</option>
                                        </select>
                                    </div>

                                    {/* Safety Equipment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Safety Equipment
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.hasSpareTools}
                                                    onChange={(e) => handleInputChange('hasSpareTools', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-gray-300">Has Spare Tools</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.hasEmergencyKit}
                                                    onChange={(e) => handleInputChange('hasEmergencyKit', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-gray-300">Has Emergency Kit</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Warnings/Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Warnings/Notes
                                        </label>
                                        <textarea
                                            value={formData.warnings}
                                            onChange={(e) => handleInputChange('warnings', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                            placeholder="Enter any warnings or notes about this vehicle"
                                        />
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-700">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isRegistering}
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                        >
                                            {isRegistering ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Registering...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <span>Register Vehicle</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
