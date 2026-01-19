
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin/Staff Role
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', session.user.email)
            .single();

        if (userError || !currentUser || !['admin', 'staff'].includes(currentUser.role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { activity_id } = body;

        if (!activity_id) {
            return NextResponse.json({ error: "Missing activity_id" }, { status: 400 });
        }

        // Fetch activity details
        const { data: activity } = await supabase
            .from('activities')
            .select('title, description, activity_type')
            .eq('id', activity_id)
            .single();

        // Fetch applications (form responses) for this activity
        const { data: applications, error } = await supabase
            .from('applications')
            .select(`
                id,
                user_id,
                form_data,
                applied_at,
                user:users (
                    name,
                    email
                )
            `)
            .eq('activity_id', activity_id);

        if (error) {
            console.error("Error fetching responses:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!applications || applications.length === 0) {
            return NextResponse.json({
                summary: "No responses to analyze yet.",
                charts: [],
                key_findings: ["No form responses have been submitted for this activity."]
            });
        }

        // Collect field data for statistical charts
        const fieldData: Record<string, Record<string, number>> = {};

        applications.forEach(app => {
            if (app.form_data) {
                Object.entries(app.form_data).forEach(([key, value]) => {
                    if (!fieldData[key]) fieldData[key] = {};
                    const val = String(value);
                    fieldData[key][val] = (fieldData[key][val] || 0) + 1;
                });
            }
        });

        // Generate charts for each field
        const charts = Object.entries(fieldData).map(([fieldName, values], idx) => {
            const chartData = Object.entries(values)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }));

            const totalResponses = Object.values(values).reduce((a, b) => a + b, 0);
            const topValue = chartData[0];
            const uniqueCount = Object.keys(values).length;

            let chartType: 'bar' | 'pie' | 'area' = 'bar';
            if (uniqueCount <= 4) chartType = 'pie';

            return {
                id: `chart-${idx}`,
                title: fieldName,
                type: chartType,
                data: chartData,
                explanation: `${totalResponses} responses with ${uniqueCount} unique values. Most common: "${topValue?.name}" (${topValue?.value} responses, ${Math.round((topValue?.value / totalResponses) * 100)}%).`
            };
        });

        // Build context for AI analysis
        const responsesSummary = applications.map(app => ({
            submitted: new Date(app.applied_at).toLocaleDateString(),
            responses: app.form_data
        }));

        // Call Gemini AI for intelligent analysis with chart recommendations
        let aiCharts: any[] = [];
        let aiSummary = '';
        let aiFindings: string[] = [];

        try {
            const prompt = `You are an expert data analyst analyzing volunteer form responses for an event. Your task is to recommend the BEST visualization type for each data field and provide insights.

Event: ${activity?.title || 'Unknown Event'}
Type: ${activity?.activity_type || 'Unknown'}
Description: ${activity?.description || 'N/A'}

Total Responses: ${applications.length}

Form Fields and Data:
${Object.entries(fieldData).map(([field, values]) => {
                const total = Object.values(values).reduce((a, b) => a + b, 0);
                const uniqueCount = Object.keys(values).length;
                const breakdown = Object.entries(values)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([v, c]) => `  - "${v}": ${c} (${Math.round((c / total) * 100)}%)`)
                    .join('\n');
                return `Field: "${field}" (${uniqueCount} unique values, ${total} responses)\n${breakdown}`;
            }).join('\n\n')}

Available Chart Types:
- "donut": Best for showing proportions/percentages (2-5 categories)
- "radar": Best for comparing multiple attributes or showing skills/preferences balance
- "horizontal": Best for comparing categories with long labels or ranking items
- "bar": Best for comparing quantities across categories  
- "pie": Best for showing simple proportions (2-4 categories)
- "area": Best for time-based or sequential data trends

For EACH field, select the most insightful visualization type based on:
1. Number of unique values
2. Data type (categorical, rating, free-text summary)
3. What insight it reveals about volunteers

Respond in this exact JSON format:
{
  "summary": "2-3 sentence analysis of the volunteer pool",
  "charts": [
    {
      "field": "Field Name",
      "type": "donut|radar|horizontal|bar|pie|area",
      "explanation": "Why this chart type reveals key insights about this data"
    }
  ],
  "key_findings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4", "Finding 5"]
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            const text = response.text || '';
            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                aiSummary = parsed.summary || '';
                aiFindings = parsed.key_findings || [];

                // Build charts using AI-recommended types
                if (parsed.charts && Array.isArray(parsed.charts)) {
                    aiCharts = parsed.charts.map((aiChart: any, idx: number) => {
                        const fieldName = aiChart.field;
                        const values = fieldData[fieldName];

                        if (!values) return null;

                        const chartData = Object.entries(values)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([name, value]) => ({
                                name: name.length > 25 ? name.slice(0, 25) + '...' : name,
                                value
                            }));

                        return {
                            id: `chart-${idx}`,
                            title: fieldName,
                            type: aiChart.type || 'bar',
                            data: chartData,
                            explanation: aiChart.explanation || `Analysis of ${fieldName} responses.`
                        };
                    }).filter(Boolean);
                }
            }
        } catch (aiError) {
            console.error("AI analysis error:", aiError);
            // Fallback to basic analysis
            aiSummary = `Analysis of ${applications.length} form responses across ${Object.keys(fieldData).length} fields.`;
            aiFindings = [
                `Total of ${applications.length} form submissions received.`,
                `Data collected across ${Object.keys(fieldData).length} different form fields.`
            ];
        }

        // Use AI charts if available, otherwise fall back to programmatic charts
        const finalCharts = aiCharts.length > 0 ? aiCharts : charts;

        // Add statistical findings if AI didn't provide enough
        if (aiFindings.length < 3) {
            const dietaryData = fieldData['Dietary Restrictions'] || fieldData['Dietary Requirements'];
            if (dietaryData) {
                const noneCount = dietaryData['None'] || 0;
                const total = Object.values(dietaryData).reduce((a, b) => a + b, 0);
                if (noneCount > 0) {
                    aiFindings.push(`${Math.round((noneCount / total) * 100)}% of volunteers have no dietary restrictions.`);
                }
            }
        }

        return NextResponse.json({
            summary: aiSummary || `Analysis of ${applications.length} form responses`,
            charts: finalCharts,
            key_findings: aiFindings
        });

    } catch (error: any) {
        console.error("Analyze Responses API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
