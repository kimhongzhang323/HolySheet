import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()

    if (!session?.googleAccessToken) {
        return NextResponse.json({ error: "Not authenticated or missing access token" }, { status: 401 })
    }

    try {
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=" + new Date().toISOString(),
            {
                headers: {
                    Authorization: `Bearer ${session.googleAccessToken}`,
                },
            }
        )

        if (!response.ok) {
            const error = await response.json()
            console.error("Google API Error:", JSON.stringify(error, null, 2))
            return NextResponse.json({ error: error.error?.message || "Failed to fetch events from Google" }, { status: response.status })
        }

        const data = await response.json()

        // Transform Google events to our CalendarEvent format
        const events = data.items.map((item: any) => {
            const start = new Date(item.start.dateTime || item.start.date)
            const end = new Date(item.end.dateTime || item.end.date)
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

            return {
                id: item.id,
                title: item.summary,
                start: start.getHours() + start.getMinutes() / 60,
                duration: duration,
                date: start.toISOString().split('T')[0],
                color: 'bg-blue-100 text-blue-800 border-blue-200', // Default color
            }
        })

        return NextResponse.json({ events })
    } catch (error: any) {
        console.error("Calendar sync error:", error)
        return NextResponse.json({ error: "Internal server error during sync" }, { status: 500 })
    }
}
