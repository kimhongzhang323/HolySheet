import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-2.0-flash-exp'),
        messages,
        tools: {
            smart_matching: tool({
                description: 'Find activities with volunteer shortages and draft WhatsApp messages to recruit volunteers with matching skills',
                parameters: z.object({
                    days_ahead: z.number().default(7).describe('Number of days to look ahead for activities'),
                }),
                execute: async ({ days_ahead }) => {
                    try {
                        // Fetch crisis activities
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/volunteers/crisis-dashboard?days_ahead=${days_ahead}`);
                        const data = await response.json();

                        const criticalActivities = data.activities?.filter((act: any) =>
                            act.volunteers_registered === 0 &&
                            new Date(act.start_time).getTime() > Date.now() + (2 * 24 * 60 * 60 * 1000) // 2+ days away
                        ) || [];

                        if (criticalActivities.length === 0) {
                            return {
                                status: 'success',
                                message: 'No activities with volunteer shortages found.',
                                activities: []
                            };
                        }

                        // Draft messages for each activity
                        const drafts = criticalActivities.map((activity: any) => ({
                            activity_id: activity.activity_id,
                            activity_title: activity.title,
                            start_time: activity.start_time,
                            location: activity.location,
                            volunteers_needed: activity.volunteers_needed,
                            draft_message: `🚨 Urgent: We need ${activity.volunteers_needed} volunteers for "${activity.title}" on ${new Date(activity.start_time).toLocaleDateString()}! ${activity.location ? `Location: ${activity.location}.` : ''} Can you help? Reply YES to sign up! 💪`
                        }));

                        return {
                            status: 'success',
                            message: `Found ${criticalActivities.length} activities needing volunteers`,
                            activities: drafts
                        };
                    } catch (error) {
                        return {
                            status: 'error',
                            message: 'Failed to fetch activity data',
                            error: String(error)
                        };
                    }
                },
            }),

            summarize_feedback: tool({
                description: 'Summarize feedback from caregivers and participants into concise insights',
                parameters: z.object({
                    activity_id: z.string().optional().describe('Specific activity ID to get feedback for, or omit for all recent feedback'),
                }),
                execute: async ({ activity_id }) => {
                    try {
                        // Mock feedback data - in production, fetch from backend
                        const mockFeedback = [
                            "The AC in Hall B is freezing cold",
                            "Hall B AC temperature is too low, seniors are uncomfortable",
                            "Can we turn up the heating in Hall B?",
                            "Great activities today, but Hall B is too cold",
                            "Loved the music session, but the AC is blasting in Hall B"
                        ];

                        // Call backend Python AI service for summarization
                        const feedbackSummary = await summarizeWithGemini(mockFeedback);

                        return {
                            status: 'success',
                            summary: feedbackSummary,
                            feedback_count: mockFeedback.length
                        };
                    } catch (error) {
                        return {
                            status: 'error',
                            message: 'Failed to summarize feedback',
                            error: String(error)
                        };
                    }
                },
            }),

            query_data: tool({
                description: 'Answer questions about activities, volunteers, and statistics using natural language',
                parameters: z.object({
                    question: z.string().describe('The question to answer about the data'),
                }),
                execute: async ({ question }) => {
                    try {
                        // Fetch relevant data based on question keywords
                        let context: any = {};

                        // If asking about activities
                        if (question.toLowerCase().includes('activit')) {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/volunteers/crisis-dashboard?days_ahead=30`);
                            const data = await response.json();
                            context.activities = data.activities;
                            context.total_activities = data.activities?.length || 0;
                        }

                        // Build a simple answer based on context
                        let answer = '';
                        if (context.total_activities !== undefined) {
                            if (question.toLowerCase().includes('zero') || question.toLowerCase().includes('no volunteer')) {
                                const zeroVolunteers = context.activities?.filter((a: any) => a.volunteers_registered === 0).length || 0;
                                answer = `There are ${zeroVolunteers} activities with zero volunteers registered.`;
                            } else {
                                answer = `There are ${context.total_activities} upcoming activities in the next 30 days.`;
                            }
                        } else {
                            answer = "I don't have enough data to answer that question. Please try asking about activities or volunteers.";
                        }

                        return {
                            status: 'success',
                            answer,
                            context_used: Object.keys(context)
                        };
                    } catch (error) {
                        return {
                            status: 'error',
                            message: 'Failed to query data',
                            error: String(error)
                        };
                    }
                },
            }),
        },
        system: `You are the AI Ops Copilot for MINDS activity hub staff. You help with:
1. Smart Matching: Finding activities with volunteer shortages and drafting recruitment messages
2. Insight Summarizer: Condensing feedback into actionable summaries
3. Auto Data Query: Answering questions about activities and volunteers

Be concise, actionable, and friendly. When you use tools, explain what you found and what actions staff can take.`,
    });

    return result.toDataStreamResponse();
}

// Helper function to summarize feedback
async function summarizeWithGemini(feedbackList: string[]): Promise<string> {
    if (feedbackList.length === 0) return "No feedback available.";
    if (feedbackList.length === 1) return feedbackList[0];

    const combined = feedbackList.map((f, i) => `${i + 1}. ${f}`).join('\n');

    const summaryResult = await streamText({
        model: google('gemini-2.0-flash-exp'),
        prompt: `Summarize this feedback into ONE concise sentence highlighting the main issue:\n\n${combined}\n\nSummary:`,
    });

    // Get the text from the stream
    let summary = '';
    for await (const chunk of summaryResult.textStream) {
        summary += chunk;
    }

    return summary.trim();
}
