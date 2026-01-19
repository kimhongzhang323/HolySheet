'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Camera, User, Mail, MapPin, Phone, FileText,
    Save, X, Check, Search, Map as MapIcon
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const center = { lat: 1.3521, lng: 103.8198 }; // Singapore
const libraries: ("places")[] = ["places"];

// Mock user data (in real app, this would come from API/database)
const INITIAL_USER_DATA = {
    name: 'Kim Hong Zhang',
    email: 'kimhongzhang@example.com',
    phone: '+65 9123 4567',
    location: 'Singapore',
    bio: 'Passionate about making a difference in the community. Love organizing events and helping others.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
};

export default function EditProfilePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [markerPosition, setMarkerPosition] = useState(center);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
        libraries
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        avatar: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/stats');
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.name || '',
                        email: session?.user?.email || data.email || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        bio: data.bio || '',
                        avatar: data.image || session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        if (session) {
            fetchProfile();
        }
    }, [session]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const response = await fetch('/api/user/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowSuccess(true);
                // Redirect back to profile after a short delay
                setTimeout(() => {
                    router.push('/profile');
                }, 1500);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Failed to update profile'}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('An error occurred while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.push('/profile');
    };

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPosition(pos);
            reverseGeocode(pos);
        }
    };

    const reverseGeocode = (pos: { lat: number, lng: number }) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                setFormData(prev => ({ ...prev, location: results[0].formatted_address }));
            }
        });
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const pos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setMarkerPosition(pos);
                setFormData(prev => ({ ...prev, location: place.formatted_address || '' }));
                map?.panTo(pos);
                map?.setZoom(17);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white rounded-full font-medium shadow-lg flex items-center gap-2"
                >
                    <Check size={20} />
                    Profile updated successfully!
                </motion.div>
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
            >
                {/* Profile Picture */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={formData.avatar}
                                alt={formData.name}
                                className="w-full h-full rounded-2xl object-cover bg-white"
                            />
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-3 bg-orange-500 rounded-xl shadow-lg hover:bg-orange-600 transition-colors">
                            <Camera size={18} className="text-white" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Click to upload a new photo</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <User size={16} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Mail size={16} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Phone size={16} />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                            placeholder="Enter your phone number"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={16} />
                            Location
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-sm"
                                placeholder="Enter your city or country"
                            />
                            <button
                                type="button"
                                onClick={() => setShowMap(true)}
                                className="px-4 bg-white border-2 border-gray-100 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-orange-600 flex items-center gap-2 text-sm font-bold shadow-sm"
                            >
                                <MapIcon size={18} />
                                <span className="hidden sm:inline">Select from Map</span>
                            </button>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FileText size={16} />
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
                            placeholder="Tell us about yourself..."
                        />
                        <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/200 characters</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Map Modal */}
            <AnimatePresence>
                {showMap && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMap(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-4xl h-[80vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Select Location</h2>
                                    <p className="text-xs text-gray-500">Search for a place or click on the map</p>
                                </div>
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 relative">
                                {isLoaded ? (
                                    <>
                                        <Autocomplete
                                            onLoad={(ac) => setAutocomplete(ac)}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <div className="absolute top-4 left-4 right-4 z-10">
                                                <div className="relative group">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search for an address..."
                                                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                        </Autocomplete>

                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={markerPosition}
                                            zoom={13}
                                            onClick={onMapClick}
                                            onLoad={(m) => setMap(m)}
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
                                            <Marker
                                                position={markerPosition}
                                                draggable={true}
                                                onDragEnd={(e) => {
                                                    if (e.latLng) {
                                                        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                                        setMarkerPosition(pos);
                                                        reverseGeocode(pos);
                                                    }
                                                }}
                                            />
                                        </GoogleMap>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-4 shrink-0">
                                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="text-orange-600" size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                        {formData.location || "Click on the map to select..."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98]"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
