'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG } from '@/lib/googleMapsConfig';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '24px'
};

// Singapore Center
const center = {
    lat: 1.3521,
    lng: 103.8198
};

const LOCATIONS = [
    {
        id: 'clementi',
        name: 'MINDS Clementi',
        position: { lat: 1.3150, lng: 103.7650 },
        address: 'Clementi Training Development Centre'
    },
    {
        id: 'amk',
        name: 'MINDS Ang Mo Kio',
        position: { lat: 1.3691, lng: 103.8454 },
        address: 'Ang Mo Kio Training Centre'
    },
    {
        id: 'tampines',
        name: 'MINDS Tampines',
        position: { lat: 1.3521, lng: 103.9447 },
        address: 'Tampines Training Development Centre'
    },
    {
        id: 'metoo',
        name: 'Me Too! Club',
        position: { lat: 1.2823, lng: 103.8242 },
        address: 'Lengkok Bahru'
    }
];

export default function DashboardMap() {
    const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<typeof LOCATIONS[0] | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-[24px]" />;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={11}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            }}
        >
            {LOCATIONS.map((loc) => (
                <Marker
                    key={loc.id}
                    position={loc.position}
                    onClick={() => setSelectedLocation(loc)}
                />
            ))}

            {selectedLocation && (
                <InfoWindow
                    position={selectedLocation.position}
                    onCloseClick={() => setSelectedLocation(null)}
                >
                    <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-gray-900 mb-1">{selectedLocation.name}</h3>
                        <p className="text-xs text-gray-500 mb-3">{selectedLocation.address}</p>

                        <div className="flex gap-2">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.position.lat},${selectedLocation.position.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-blue-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center hover:bg-blue-700 transition-colors"
                            >
                                Google Maps
                            </a>
                            <a
                                href={`https://waze.com/ul?ll=${selectedLocation.position.lat},${selectedLocation.position.lng}&navigate=yes`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-cyan-400 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center hover:bg-cyan-500 transition-colors"
                            >
                                Waze
                            </a>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
