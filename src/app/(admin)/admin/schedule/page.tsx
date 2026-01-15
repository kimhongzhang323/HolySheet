'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import MasterCalendar from '@/components/MasterCalendar';
import CreateActivityModal, { ActivityFormData } from '@/components/CreateActivityModal';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    volunteersNeeded?: number;
    volunteersRegistered?: number;
    capacity?: number;
    skillsRequired?: string[];
}

// Mock events for demonstration
const mockEvents: CalendarEvent[] = [
    {
        id: '1',
        title: 'Community Workshop',
        start: new Date(2026, 0, 16, 10, 0), // Jan 16, 2026, 10:00 AM
        end: new Date(2026, 0, 16, 12, 0),
        location: 'Community Center Room 101',
        volunteersNeeded: 5,
        volunteersRegistered: 3,
        capacity: 30,
        skillsRequired: ['Teaching', 'Communication']
    },
    {
        id: '2',
        title: 'Food Bank Distribution',
        start: new Date(2026, 0, 17, 9, 0), // Jan 17, 2026, 9:00 AM
        end: new Date(2026, 0, 17, 13, 0),
        location: 'Main Street Food Bank',
        volunteersNeeded: 10,
        volunteersRegistered: 8,
        capacity: 50,
        skillsRequired: ['Organization', 'Physical Fitness']
    },
    {
        id: '3',
        title: 'Skills Training Session',
        start: new Date(2026, 0, 18, 14, 0), // Jan 18, 2026, 2:00 PM
        end: new Date(2026, 0, 18, 16, 30),
        location: 'Training Center',
        volunteersNeeded: 3,
        volunteersRegistered: 3,
        capacity: 20,
        skillsRequired: ['First Aid', 'CPR']
    },
    {
        id: '4',
        title: 'Park Cleanup Event',
        start: new Date(2026, 0, 19, 8, 0), // Jan 19, 2026, 8:00 AM
        end: new Date(2026, 0, 19, 12, 0),
        location: 'Central Park',
        volunteersNeeded: 15,
        volunteersRegistered: 12,
        capacity: 40,
        skillsRequired: ['Environment Care']
    },
    {
        id: '5',
        title: 'Youth Mentorship Program',
        start: new Date(2026, 0, 20, 15, 0), // Jan 20, 2026, 3:00 PM
        end: new Date(2026, 0, 20, 17, 0),
        location: 'Youth Center',
        volunteersNeeded: 8,
        volunteersRegistered: 5,
        capacity: 25,
        skillsRequired: ['Mentoring', 'Communication']
    },
    {
        id: '6',
        title: 'Senior Care Visit',
        start: new Date(2026, 0, 21, 10, 0), // Jan 21, 2026, 10:00 AM
        end: new Date(2026, 0, 21, 12, 0),
        location: 'Sunshine Senior Home',
        volunteersNeeded: 6,
        volunteersRegistered: 6,
        capacity: 15,
        skillsRequired: ['Compassion', 'Communication']
    },
    {
        id: '7',
        title: 'Coding Workshop for Kids',
        start: new Date(2026, 0, 22, 13, 0), // Jan 22, 2026, 1:00 PM
        end: new Date(2026, 0, 22, 16, 0),
        location: 'Tech Hub',
        volunteersNeeded: 4,
        volunteersRegistered: 2,
        capacity: 20,
        skillsRequired: ['Programming', 'Teaching']
    },
    {
        id: '8',
        title: 'Animal Shelter Support',
        start: new Date(2026, 0, 23, 9, 0), // Jan 23, 2026, 9:00 AM
        end: new Date(2026, 0, 23, 14, 0),
        location: 'Happy Paws Shelter',
        volunteersNeeded: 7,
        volunteersRegistered: 4,
        capacity: 12,
        skillsRequired: ['Animal Care']
    },
    {
        id: '9',
        title: 'Community Garden Project',
        start: new Date(2026, 0, 24, 7, 0), // Jan 24, 2026, 7:00 AM
        end: new Date(2026, 0, 24, 11, 0),
        location: 'Westside Community Garden',
        volunteersNeeded: 12,
        volunteersRegistered: 10,
        capacity: 30,
        skillsRequired: ['Gardening', 'Physical Fitness']
    },
    {
        id: '10',
        title: 'Holiday Meal Preparation',
        start: new Date(2026, 0, 25, 11, 0), // Jan 25, 2026, 11:00 AM
        end: new Date(2026, 0, 25, 15, 0),
        location: 'Community Kitchen',
        volunteersNeeded: 10,
        volunteersRegistered: 7,
        capacity: 100,
        skillsRequired: ['Cooking', 'Food Safety']
    }
];

export default function SchedulePage() {
    const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSlotDate, setSelectedSlotDate] = useState<Date | undefined>();

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/admin/activities', { headers });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized access to activities');
                    // Optionally redirect to login or show error
                }
                return;
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                console.error('Expected array of activities but got:', data);
                return;
            }

            const formattedEvents: CalendarEvent[] = data.map((activity: any) => ({
                id: activity._id || activity.id,
                title: activity.title,
                start: new Date(activity.start_time),
                end: new Date(activity.end_time),
                location: activity.location,
                volunteersNeeded: activity.volunteers_needed,
                volunteersRegistered: activity.volunteers_registered,
                capacity: activity.capacity,
                skillsRequired: activity.skills_required
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        }
    };

    const handleCreateActivity = async (formData: ActivityFormData) => {
        try {
            const response = await fetch('/api/admin/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchActivities();
                setShowCreateModal(false);
            } else {
                alert('Failed to create activity');
            }
        } catch (error) {
            console.error('Failed to create activity:', error);
            alert('Failed to create activity');
        }
    };

    const handleEventClick = (event: CalendarEvent) => {
        console.log('Event clicked:', event);
        // TODO: Implement edit modal
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setSelectedSlotDate(slotInfo.start);
        setShowCreateModal(true);
    };

    const handleEventDrop = async (event: CalendarEvent, start: Date, end: Date) => {
        try {
            const response = await fetch(`/api/admin/activities/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...event,
                    start_time: start.toISOString(),
                    end_time: end.toISOString()
                })
            });

            if (response.ok) {
                fetchActivities();
            } else {
                alert('Failed to update activity');
            }
        } catch (error) {
            console.error('Failed to update activity:', error);
            alert('Failed to update activity');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white px-8 py-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
                    <button
                        onClick={() => {
                            setSelectedSlotDate(new Date());
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                    >
                        <Plus size={18} />
                        New Activity
                    </button>
                </div>
            </header>

            {/* Calendar */}
            <div className="p-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="h-[800px]">
                        <MasterCalendar
                            events={events}
                            onEventClick={handleEventClick}
                            onSelectSlot={handleSelectSlot}
                            onEventDrop={handleEventDrop}
                        />
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <CreateActivityModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setSelectedSlotDate(undefined);
                }}
                onSubmit={handleCreateActivity}
                initialDate={selectedSlotDate}
            />
        </div>
    );
}
