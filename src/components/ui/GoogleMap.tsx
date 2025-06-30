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
}

interface MarkerProps {
    position: { lat: number; lng: number };
    map?: any;
    title?: string;
    icon?: string;
}

// Map component
const Map: React.FC<MapProps> = ({ center, zoom, children, className }) => {
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
        }
    }, [ref, map, center, zoom]);

    return (
        <div ref={ref} className={className}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { map } as any);
                }
            })}
        </div>
    );
};

// Marker component
const Marker: React.FC<MarkerProps> = ({ position, map, title, icon }) => {
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
        }

        return () => {
            if (marker) {
                marker.setMap(null);
            }
        };
    }, [marker, position, map, title, icon]);

    useEffect(() => {
        if (marker) {
            marker.setOptions({ position, title, icon });
        }
    }, [marker, position, title, icon]);

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
interface GoogleMapProps {
    className?: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ className = "h-96 w-full" }) => {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

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

    return (
        <div className={className}>
            <Wrapper apiKey={apiKey} render={render} />
        </div>
    );
};

export default GoogleMap;
