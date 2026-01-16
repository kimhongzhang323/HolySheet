import { useState, useMemo, useEffect } from "react";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { Loader2, MapPin } from "lucide-react";

interface LocationPickerProps {
    value: string;
    latitude?: number;
    longitude?: number;
    onChange: (address: string, lat: number, lng: number) => void;
}

const libraries: ("places")[] = ["places"];

export default function LocationPicker({ value, latitude, longitude, onChange }: LocationPickerProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
        libraries,
    });

    if (!isLoaded) return <div className="h-[300px] w-full bg-gray-100 rounded-xl flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    return <MapInterface value={value} lat={latitude} lng={longitude} onChange={onChange} />;
}

function MapInterface({ value, lat, lng, onChange }: { value: string, lat?: number, lng?: number, onChange: (address: string, lat: number, lng: number) => void }) {
    const center = useMemo(() => ({ lat: lat || 1.3521, lng: lng || 103.8198 }), [lat, lng]); // Default Singapore
    const [selected, setSelected] = useState(center);

    // Sync state with props only if props change significantly (avoids loops)
    useEffect(() => {
        if (lat && lng && (lat !== selected.lat || lng !== selected.lng)) {
            setSelected({ lat, lng });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lng]);

    const {
        ready,
        value: inputValue,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: "sg" }, // Restrict to Singapore for now, optional
        },
        defaultValue: value,
        debounce: 300,
    });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = getLatLng(results[0]);
            setSelected({ lat, lng });
            onChange(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const onMapClick = async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setSelected({ lat, lng });

            // Reverse Geocode to get address
            try {
                const results = await getGeocode({ location: { lat, lng } });
                if (results[0]) {
                    const address = results[0].formatted_address;
                    setValue(address, false);
                    onChange(address, lat, lng);
                }
            } catch (error) {
                console.error("Reverse geocode failed", error);
                onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    value={inputValue}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Search location..."
                />
                {status === "OK" && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200">
                <GoogleMap
                    zoom={15}
                    center={selected}
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    onClick={onMapClick}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    <MarkerF position={selected} />
                </GoogleMap>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} />
                <span>Click map to adjust pin position precisely</span>
            </div>
        </div>
    );
}
