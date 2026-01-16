import { useState, useEffect } from "react";
import { X, Loader2, Save, Edit2 } from "lucide-react";
import LocationPicker from "./LocationPicker";

interface Event {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    volunteers_needed: number;
    activity_type: string;
    status: string;
}

interface EditEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    onSave: (updatedEvent: Partial<Event>) => Promise<void>;
}

export default function EditEventDialog({ isOpen, onClose, event, onSave }: EditEventDialogProps) {
    const [formData, setFormData] = useState<Partial<Event>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                start_time: event.start_time,
                end_time: event.end_time,
                location: event.location,
                latitude: event.latitude,
                longitude: event.longitude,
                capacity: event.capacity,
                volunteers_needed: event.volunteers_needed,
                activity_type: event.activity_type,
                status: event.status
            });
        }
    }, [event]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save event", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof Event, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper to format usage for datetime-local input
    // "2023-01-01T12:00:00" -> "2023-01-01T12:00"
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return "";
        return isoString.slice(0, 16);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
                            <p className="text-sm text-gray-500">Update event details and location</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title || ""}
                                onChange={(e) => handleChange("title", e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description || ""}
                                onChange={(e) => handleChange("description", e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={formatDateForInput(formData.start_time)}
                                onChange={(e) => handleChange("start_time", new Date(e.target.value).toISOString())}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={formatDateForInput(formData.end_time)}
                                onChange={(e) => handleChange("end_time", new Date(e.target.value).toISOString())}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Total Capacity</label>
                            <input
                                type="number"
                                min={1}
                                value={formData.capacity || 20}
                                onChange={(e) => handleChange("capacity", parseInt(e.target.value))}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Volunteers Needed</label>
                            <input
                                type="number"
                                min={1}
                                value={formData.volunteers_needed || 5}
                                onChange={(e) => handleChange("volunteers_needed", parseInt(e.target.value))}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                        <p className="text-xs text-gray-500 mb-2">Search for a place or click on the map to set the location.</p>
                        <LocationPicker
                            value={formData.location || ""}
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onChange={(addr, lat, lng) => {
                                setFormData(prev => ({ ...prev, location: addr, latitude: lat, longitude: lng }));
                            }}
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
