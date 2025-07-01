'use client';

import { Wrapper, Status } from '@googlemaps/react-wrapper';
import React, { useEffect, useRef, useState } from 'react';

// Declare global types for Google Maps
declare global {
    interface Window {
        google: typeof google;
    }
}

// Types for map props
interface MapProps {
    center: { lat: number; lng: number };
    zoom: number;
    children?: React.ReactNode;
    className?: string;
    onMapReady?: (map: any) => void;
}

interface MarkerProps {
    position: { lat: number; lng: number };
    map?: any;
    title?: string;
    icon?: string;
    onClick?: () => void;
}

// Map component
const Map: React.FC<MapProps> = ({ center, zoom, children, className, onMapReady }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>();

    useEffect(() => {
        if (ref.current && !map && window.google) {
            const newMap = new window.google.maps.Map(ref.current, {
                center,
                zoom,
                styles: [
                    {
                        "elementType": "geometry",
                        "stylers": [{ "color": "#1f2937" }]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#1f2937" }]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#9ca3af" }]
                    },
                    {
                        "featureType": "administrative.locality",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#d1d5db" }]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#d1d5db" }]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#374151" }]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#6b7280" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#374151" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.stroke",
                        "stylers": [{ "color": "#1f2937" }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#9ca3af" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#1f2937" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.stroke",
                        "stylers": [{ "color": "#1f2937" }]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#f3f4f6" }]
                    },
                    {
                        "featureType": "transit",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#374151" }]
                    },
                    {
                        "featureType": "transit.station",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#d1d5db" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{ "color": "#111827" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [{ "color": "#4b5563" }]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.stroke",
                        "stylers": [{ "color": "#111827" }]
                    }
                ]
            });
            setMap(newMap);
            if (onMapReady) {
                onMapReady(newMap);
            }
        }
    }, [ref, map, center, zoom, onMapReady]);

    return (
        <div ref={ref} className={className}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    // Check if the child is a valid React component that can receive props
                    if (typeof child.type === 'string' || child.type === React.Fragment) {
                        return child;
                    }
                    return React.cloneElement(child, { map } as any);
                }
                return child;
            })}
        </div>
    );
};

// Marker component
const Marker: React.FC<MarkerProps> = ({ position, map, title, icon, onClick }) => {
    const [marker, setMarker] = useState<google.maps.Marker>();

    useEffect(() => {
        if (!marker) {
            const newMarker = new google.maps.Marker({
                position,
                map,
                title,
                icon: icon || undefined,
            });
            setMarker(newMarker);

            // Add click listener if onClick is provided
            if (onClick) {
                newMarker.addListener('click', onClick);
            }
        }

        return () => {
            if (marker) {
                marker.setMap(null);
            }
        };
    }, [marker, position, map, title, icon, onClick]);

    useEffect(() => {
        if (marker) {
            marker.setOptions({ position, title, icon });
        }
    }, [marker, position, title, icon]);

    return null;
};

// InfoWindow component for enhanced vehicle details
interface InfoWindowProps {
    position: { lat: number; lng: number };
    map?: any;
    vehicle?: VehicleLocation;
    onClose?: () => void;
}

const InfoWindow: React.FC<InfoWindowProps> = ({ position, map, vehicle, onClose }) => {
    const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow>();

    useEffect(() => {
        if (!infoWindow && vehicle) {
            const location = vehicle.currentLocation || vehicle.latestTrackingPoint;
            const lastUpdate = location?.timestamp ?
                new Date(location.timestamp.seconds * 1000).toLocaleString() :
                'Unknown';
            const speed = vehicle.latestTrackingPoint?.speed;

            const content = `
                <div style="padding: 12px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${vehicle.status === 'started' ? '#10b981' : vehicle.status === 'completed' ? '#3b82f6' : '#f59e0b'}; margin-right: 8px;"></div>
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">Vehicle ${vehicle.vehicleId}</h3>
                    </div>
                    <div style="border-left: 3px solid #e5e7eb; padding-left: 12px; margin-left: 6px;">
                        <p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Status:</strong> <span style="color: ${vehicle.status === 'started' ? '#10b981' : vehicle.status === 'completed' ? '#3b82f6' : '#f59e0b'};">${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</span></p>
                        <p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Job ID:</strong> ${vehicle.jobId}</p>
                        ${speed !== null && speed !== undefined ? `<p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Speed:</strong> ${speed} km/h</p>` : ''}
                        ${vehicle.trackingPointsCount ? `<p style="margin: 4px 0; font-size: 14px; color: #374151;"><strong>Tracking Points:</strong> ${vehicle.trackingPointsCount}</p>` : ''}
                        <p style="margin: 4px 0; font-size: 12px; color: #6b7280;"><strong>Last Update:</strong> ${lastUpdate}</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">📍 ${location?.latitude.toFixed(6)}, ${location?.longitude.toFixed(6)}</p>
                    </div>
                </div>
            `;

            const newInfoWindow = new google.maps.InfoWindow({
                content,
                position,
            });

            newInfoWindow.open(map);
            setInfoWindow(newInfoWindow);

            // Add close listener
            newInfoWindow.addListener('closeclick', () => {
                if (onClose) onClose();
            });
        }

        return () => {
            if (infoWindow) {
                infoWindow.close();
            }
        };
    }, [infoWindow, position, map, vehicle, onClose]);

    return null;
};

// Loading component
const MapLoadingComponent = () => (
    <div className="flex items-center justify-center h-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
    </div>
);

// Error component
const MapErrorComponent = () => (
    <div className="flex items-center justify-center h-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
        <div className="text-center">
            <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-sm">!</span>
            </div>
            <p className="text-red-400 text-sm">Failed to load map</p>
        </div>
    </div>
);

// Render function for the wrapper
const render = (status: Status) => {
    switch (status) {
        case Status.LOADING:
            return <MapLoadingComponent />;
        case Status.FAILURE:
            return <MapErrorComponent />;
        case Status.SUCCESS:
            return <Map center={{ lat: 6.9271, lng: 79.8612 }} zoom={13} className="h-full w-full rounded-lg">
                {/* Sample markers for DriveOrbit vehicles */}
                <Marker
                    position={{ lat: 6.9271, lng: 79.8612 }}
                    title="DriveOrbit HQ"
                />
                <Marker
                    position={{ lat: 6.9345, lng: 79.8550 }}
                    title="Vehicle 1 - Toyota Camry"
                />
                <Marker
                    position={{ lat: 6.9200, lng: 79.8700 }}
                    title="Vehicle 2 - Honda Accord"
                />
                <Marker
                    position={{ lat: 6.9150, lng: 79.8500 }}
                    title="Vehicle 3 - Ford Explorer"
                />
            </Map>;
    }
};

// Main GoogleMap component
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

interface GoogleMapProps {
    className?: string;
    vehicles?: VehicleLocation[];
    showVehicles?: boolean;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
    className = "h-96 w-full",
    vehicles = [],
    showVehicles = false
}) => {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
    const [infoWindowPosition, setInfoWindowPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                <div className="text-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-sm">?</span>
                    </div>
                    <p className="text-yellow-400 text-sm">Google Maps API key not configured</p>
                </div>
            </div>
        );
    }

    const render = (status: Status) => {
        switch (status) {
            case Status.LOADING:
                return <MapLoadingComponent />;
            case Status.FAILURE:
                return <MapErrorComponent />;
            case Status.SUCCESS:
                return (
                    <>
                        <Map center={{ lat: 6.9271, lng: 79.8612 }} zoom={13} className="h-full w-full rounded-lg" onMapReady={setMapInstance}>
                            {/* DriveOrbit HQ Marker */}
                            <Marker
                                position={{ lat: 6.9271, lng: 79.8612 }}
                                title="🏢 DriveOrbit Headquarters
📍 Main Office & Control Center
📞 Customer Service Center
🚗 Fleet Management Hub"
                                icon="data:image/svg+xml;charset=UTF-8,%3csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cfilter id='hqShadow' x='-50%25' y='-50%25' width='200%25' height='200%25'%3e%3cfeDropShadow dx='0' dy='3' stdDeviation='4' flood-color='rgba(0,0,0,0.4)'/%3e%3c/filter%3e%3clinearGradient id='hqGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%23dc2626;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%23ef4444;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='25' cy='25' r='22' fill='url(%23hqGrad)' stroke='white' stroke-width='3' filter='url(%23hqShadow)'/%3e%3cpath d='M15 20h20v15H15v-15z M20 15v5h10v-5l-5-3-5 3z M18 25h3v5h-3v-5z M29 25h3v5h-3v-5z M23 25h4v3h-4v-3z' fill='white'/%3e%3ccircle cx='40' cy='10' r='8' fill='%23fbbf24' stroke='white' stroke-width='2'/%3e%3cpath d='M36 10h8M40 6v8' stroke='white' stroke-width='2'/%3e%3c/svg%3e"
                            />

                            {/* Live Vehicle Markers */}
                            {showVehicles && vehicles.map((vehicle) => {
                                const location = vehicle.currentLocation || vehicle.latestTrackingPoint;
                                if (!location) return null;

                                // Determine vehicle icon based on status
                                const getVehicleIcon = (status: string) => {
                                    const isActive = status === 'started';
                                    const baseIcon = `
                                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                                            </filter>
                                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" style="stop-color:${status === 'started' ? '#1f2937' : status === 'completed' ? '#1e40af' : '#d97706'};stop-opacity:1" />
                                                <stop offset="100%" style="stop-color:${status === 'started' ? '#374151' : status === 'completed' ? '#3b82f6' : '#f59e0b'};stop-opacity:1" />
                                            </linearGradient>
                                            ${isActive ? `
                                            <style>
                                                .pulse-ring {
                                                    animation: pulse 2s infinite;
                                                    transform-origin: center;
                                                }
                                                @keyframes pulse {
                                                    0% { transform: scale(1); opacity: 1; }
                                                    50% { transform: scale(1.1); opacity: 0.7; }
                                                    100% { transform: scale(1); opacity: 1; }
                                                }
                                            </style>
                                            ` : ''}
                                        </defs>
                                        ${isActive ? '<circle cx="20" cy="20" r="22" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6" class="pulse-ring"/>' : ''}
                                        <!-- Outer circle with gradient -->
                                        <circle cx="20" cy="20" r="18" fill="url(#grad)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
                                        <!-- Vehicle icon -->
                                        <path d="M12 14h16l-2 8H14l-2-8z M10 16v2h2v-2h-2z M26 16v2h2v-2h-2z M14 18h12v2H14v-2z" fill="white"/>
                                        <!-- Status indicator -->
                                        <circle cx="32" cy="8" r="6" fill="${status === 'started' ? '#10b981' : status === 'completed' ? '#3b82f6' : '#f59e0b'}" stroke="white" stroke-width="2"/>
                                        ${isActive ? '<circle cx="32" cy="8" r="3" fill="white"/>' : ''}
                                    </svg>
                                `;
                                    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(baseIcon)}`;
                                };

                                // Enhanced title with more information
                                const getVehicleTitle = (vehicle: VehicleLocation) => {
                                    const location = vehicle.currentLocation || vehicle.latestTrackingPoint;
                                    const lastUpdate = location?.timestamp ?
                                        new Date(location.timestamp.seconds * 1000).toLocaleString() :
                                        'Unknown';

                                    const speed = vehicle.latestTrackingPoint?.speed;

                                    return `🚗 Vehicle ${vehicle.vehicleId}
Status: ${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
Job ID: ${vehicle.jobId}
Last Update: ${lastUpdate}
${vehicle.trackingPointsCount ? `Tracking Points: ${vehicle.trackingPointsCount}` : ''}
${speed !== null && speed !== undefined ? `Speed: ${speed} km/h` : ''}`;
                                };

                                return (
                                    <Marker
                                        key={`${vehicle.vehicleId}-${vehicle.jobId}`}
                                        position={{
                                            lat: location.latitude,
                                            lng: location.longitude
                                        }}
                                        title={getVehicleTitle(vehicle)}
                                        icon={getVehicleIcon(vehicle.status)}
                                        onClick={() => {
                                            setSelectedVehicle(vehicle);
                                            setInfoWindowPosition({
                                                lat: location.latitude,
                                                lng: location.longitude
                                            });
                                        }}
                                    />
                                );
                            })}

                            {/* Static Sample Markers (only show if no live vehicles) */}
                            {!showVehicles && (
                                <>
                                    <Marker
                                        position={{ lat: 6.9345, lng: 79.8550 }}
                                        title="🚗 Vehicle 1 - Toyota Camry
Status: Available
Location: Colombo City"
                                        icon="data:image/svg+xml;charset=UTF-8,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cfilter id='shadow' x='-50%25' y='-50%25' width='200%25' height='200%25'%3e%3cfeDropShadow dx='0' dy='2' stdDeviation='3' flood-color='rgba(0,0,0,0.3)'/%3e%3c/filter%3e%3clinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%231f2937;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%23374151;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='20' cy='20' r='18' fill='url(%23grad1)' stroke='white' stroke-width='2' filter='url(%23shadow)'/%3e%3cpath d='M12 14h16l-2 8H14l-2-8z M10 16v2h2v-2h-2z M26 16v2h2v-2h-2z M14 18h12v2H14v-2z' fill='white'/%3e%3ccircle cx='32' cy='8' r='6' fill='%2310b981' stroke='white' stroke-width='2'/%3e%3c/svg%3e"
                                    />
                                    <Marker
                                        position={{ lat: 6.9200, lng: 79.8700 }}
                                        title="🚗 Vehicle 2 - Honda Accord
Status: On Trip
Location: Kandy Road"
                                        icon="data:image/svg+xml;charset=UTF-8,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cfilter id='shadow' x='-50%25' y='-50%25' width='200%25' height='200%25'%3e%3cfeDropShadow dx='0' dy='2' stdDeviation='3' flood-color='rgba(0,0,0,0.3)'/%3e%3c/filter%3e%3clinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%231e40af;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%233b82f6;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='20' cy='20' r='18' fill='url(%23grad2)' stroke='white' stroke-width='2' filter='url(%23shadow)'/%3e%3cpath d='M12 14h16l-2 8H14l-2-8z M10 16v2h2v-2h-2z M26 16v2h2v-2h-2z M14 18h12v2H14v-2z' fill='white'/%3e%3ccircle cx='32' cy='8' r='6' fill='%233b82f6' stroke='white' stroke-width='2'/%3e%3c/svg%3e"
                                    />
                                    <Marker
                                        position={{ lat: 6.9150, lng: 79.8500 }}
                                        title="🚗 Vehicle 3 - Ford Explorer
Status: Maintenance
Location: Service Center"
                                        icon="data:image/svg+xml;charset=UTF-8,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cfilter id='shadow' x='-50%25' y='-50%25' width='200%25' height='200%25'%3e%3cfeDropShadow dx='0' dy='2' stdDeviation='3' flood-color='rgba(0,0,0,0.3)'/%3e%3c/filter%3e%3clinearGradient id='grad3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%23d97706;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%23f59e0b;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='20' cy='20' r='18' fill='url(%23grad3)' stroke='white' stroke-width='2' filter='url(%23shadow)'/%3e%3cpath d='M12 14h16l-2 8H14l-2-8z M10 16v2h2v-2h-2z M26 16v2h2v-2h-2z M14 18h12v2H14v-2z' fill='white'/%3e%3ccircle cx='32' cy='8' r='6' fill='%23f59e0b' stroke='white' stroke-width='2'/%3e%3c/svg%3e"
                                    />
                                </>
                            )}
                        </Map>

                        {/* InfoWindow for selected vehicle */}
                        {selectedVehicle && infoWindowPosition && mapInstance && (
                            <InfoWindow
                                position={infoWindowPosition}
                                vehicle={selectedVehicle}
                                onClose={() => {
                                    setSelectedVehicle(null);
                                    setInfoWindowPosition(null);
                                }}
                                map={mapInstance}
                            />
                        )}
                    </>
                );
        }
    };

    return (
        <div className={className}>
            <Wrapper apiKey={apiKey} render={render} />
        </div>
    );
};

export default GoogleMap;
