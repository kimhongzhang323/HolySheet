from datetime import datetime
from urllib.parse import urlencode

def generate_google_calendar_link(
    title: str,
    description: str,
    location: str,
    start_time: datetime,
    end_time: datetime
) -> str:
    base_url = 'https://calendar.google.com/calendar/render'
    action = 'TEMPLATE'

    def format_time(dt: datetime) -> str:
        return dt.strftime('%Y%m%dT%H%M%SZ')

    start = format_time(start_time)
    end = format_time(end_time)

    params = {
        'action': action,
        'text': title,
        'details': f"{description}\n\nLocation: {location}",
        'location': location,
        'dates': f"{start}/{end}",
    }

    return f"{base_url}?{urlencode(params)}"

def generate_ics_content(
    title: str,
    description: str,
    location: str,
    start_time: datetime,
    end_time: datetime
) -> str:
    def format_time(dt: datetime) -> str:
        return dt.strftime('%Y%m%dT%H%M%SZ')

    now = format_time(datetime.utcnow())
    start = format_time(start_time)
    end = format_time(end_time)
    
    # Simple sanitization for description to avoid breaking ICS format
    clean_desc = description.replace('\n', '\\n')

    return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HolySheet//Booking System//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:{now}
UID:{now}-{start}@holysheet.com
DTSTART:{start}
DTEND:{end}
SUMMARY:{title}
DESCRIPTION:{clean_desc}\\n\\nLocation: {location}
LOCATION:{location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""
