'use client';

import { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg, EventContentArg } from '@fullcalendar/core';
import TiltedCard from './TiltedCard';
import EventDetailPopup from './EventDetailPopup';

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

interface MasterCalendarProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
    onEventDrop: (event: CalendarEvent, start: Date, end: Date) => void;
}

export default function MasterCalendar({
    events,
    onEventClick,
    onSelectSlot,
    onEventDrop
}: MasterCalendarProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
    const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Convert events to FullCalendar format
    const fullCalendarEvents = events.map(event => {
        // Determine color based on volunteer status
        let backgroundColor = '#10b981'; // Green - filled
        let borderColor = '#059669';

        if (event.volunteersNeeded && event.volunteersNeeded > 0) {
            const fillRate = (event.volunteersRegistered || 0) / event.volunteersNeeded;

            if (fillRate < 0.5) {
                backgroundColor = '#ef4444'; // Red - critical
                borderColor = '#dc2626';
            } else if (fillRate < 1) {
                backgroundColor = '#f59e0b'; // Yellow - warning
                borderColor = '#d97706';
            }
        }

        return {
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            backgroundColor,
            borderColor,
            extendedProps: {
                location: event.location,
                volunteersNeeded: event.volunteersNeeded,
                volunteersRegistered: event.volunteersRegistered,
                capacity: event.capacity,
                skillsRequired: event.skillsRequired
            }
        };
    });

    const handleEventClick = (info: EventClickArg) => {
        const originalEvent = events.find(e => e.id === info.event.id);
        if (originalEvent) {
            onEventClick(originalEvent);
        }
    };

    const handleSelect = (selectInfo: DateSelectArg) => {
        onSelectSlot({
            start: selectInfo.start,
            end: selectInfo.end
        });
    };

    const handleEventDrop = (info: EventDropArg) => {
        const originalEvent = events.find(e => e.id === info.event.id);
        if (originalEvent && info.event.start && info.event.end) {
            onEventDrop(originalEvent, info.event.start, info.event.end);
        }
    };

    const renderEventContent = (eventInfo: EventContentArg) => {
        const volunteersText = eventInfo.event.extendedProps.volunteersNeeded
            ? `${eventInfo.event.extendedProps.volunteersRegistered || 0}/${eventInfo.event.extendedProps.volunteersNeeded} 👥`
            : '';

        const handleMouseEnter = () => {
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }

            // Set new timeout for 1 second
            hoverTimeoutRef.current = setTimeout(() => {
                const originalEvent = events.find(e => e.id === eventInfo.event.id);
                if (originalEvent) {
                    setPopupEvent(originalEvent);
                }
            }, 1000);
        };

        const handleMouseLeave = () => {
            // Clear timeout if user leaves before 3 seconds
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };

        return (
            <div
                className="event-wrapper h-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className="h-full w-full rounded-[4px] p-2 cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: eventInfo.backgroundColor }}
                >
                    <div className="font-semibold text-sm leading-tight text-white mb-0.5">{eventInfo.event.title}</div>
                    <div className="text-xs text-white/90">{eventInfo.timeText}</div>
                    {volunteersText && (
                        <div className="text-xs text-white/90 mt-0.5">{volunteersText}</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full relative">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={fullCalendarEvents}
                eventClick={handleEventClick}
                select={handleSelect}
                eventDrop={handleEventDrop}
                height="100%"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                nowIndicator={true}
                eventContent={renderEventContent}
            />

            <EventDetailPopup
                event={popupEvent}
                onClose={() => setPopupEvent(null)}
                backgroundColor={
                    popupEvent?.volunteersNeeded && popupEvent.volunteersNeeded > 0
                        ? (popupEvent.volunteersRegistered || 0) / popupEvent.volunteersNeeded < 0.5
                            ? '#ef4444'
                            : (popupEvent.volunteersRegistered || 0) / popupEvent.volunteersNeeded < 1
                                ? '#f59e0b'
                                : '#10b981'
                        : '#10b981'
                }
            />
        </div>
    );
}
