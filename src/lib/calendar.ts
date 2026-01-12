export interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    start_time: Date;
    end_time: Date;
}

export function generateGoogleCalendarLink(event: CalendarEvent): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const action = 'TEMPLATE';

    // Format dates as YYYYMMDDTHHmmssZ
    const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const start = formatTime(new Date(event.start_time));
    const end = formatTime(new Date(event.end_time));

    const params = new URLSearchParams({
        action,
        text: event.title,
        details: `${event.description}\n\nLocation: ${event.location}`, // Added to description as requested
        location: event.location,
        dates: `${start}/${end}`,
    });

    return `${baseUrl}?${params.toString()}`;
}

export function generateICSContent(event: CalendarEvent): string {
    const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const now = formatTime(new Date());
    const start = formatTime(new Date(event.start_time));
    const end = formatTime(new Date(event.end_time));

    // Basic ICS format
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HolySheet//Booking System//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:${now}
UID:${now}-${start}@holysheet.com
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}\\n\\nLocation: ${event.location}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}
