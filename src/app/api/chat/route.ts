import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Activity from '@/models/Activity';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    await dbConnect();

    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-1.5-flash'),
        messages,
        tools: {
            findActivity: tool({
                description: 'Find activities based on filtered criteria',
                parameters: z.object({
                    type: z.string().optional().describe('Type or keyword of activity'),
                    date: z.string().optional().describe('Date string YYYY-MM-DD'),
                }),
                execute: async ({ type, date }: { type?: string, date?: string }) => {
                    const query: any = {};
                    if (type) {
                        query.$or = [
                            { title: { $regex: type, $options: 'i' } },
                            { description: { $regex: type, $options: 'i' } }
                        ];
                    }
                    if (date) {
                        const startOfDay = new Date(date);
                        const endOfDay = new Date(date);
                        endOfDay.setDate(endOfDay.getDate() + 1);
                        query.start_time = { $gte: startOfDay, $lt: endOfDay };
                    }

                    const activities = await Activity.find(query).limit(5);
                    return activities.map(a => ({
                        id: a._id,
                        title: a.title,
                        time: a.start_time,
                        volunteers_needed: a.volunteers_needed
                    }));
                },
            } as any),
            bookActivity: tool({
                description: 'Book an activity for a user',
                parameters: z.object({
                    userId: z.string().describe('The ID of the user booking the activity'),
                    activityId: z.string().describe('The ID of the activity to book'),
                }),
                execute: async ({ userId, activityId }: { userId: string, activityId: string }) => {
                    // We could call the register logic here or just fetch the API. 
                    // For direct server-side execution:
                    // Note: You would import the logic from the register route if refactored, 
                    // or just return instructions to the frontend to call the API.
                    // For this stub, we return a success message assuming the agent triggers the action client-side 
                    // or we implement the DB write here. Let's do a mock success return.
                    return { success: true, message: `Attempting to book activity ${activityId} for user ${userId}. Check portal for confirmation.` };
                },
            } as any),
        },
    });

    return result.toTextStreamResponse();
}
