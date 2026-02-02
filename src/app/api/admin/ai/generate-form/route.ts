
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";
import { supabase } from '@/lib/supabaseClient';

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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { topic } = body;

        if (!topic) {
            return NextResponse.json({ error: "Missing topic" }, { status: 400 });
        }

        const prompt = `You are an expert form designer for volunteer management.
        Based on the following activity description, generate a recruitment form structure.

        Activity: ${topic}

        Return a JSON object with:
        1. title: A catchy title for the form
        2. description: A welcoming description for volunteers
        3. fields: An array of form fields. Each field must have:
           - label: Field question
           - type: 'text' | 'textarea' | 'select' | 'checkbox'
           - required: boolean
           - options: array of strings (only for select/checkbox type)

        Make sure to include standard fields like "Why do you want to join?", "Dietary Restrictions", "Emergency Contact".
        Also include specific questions relevant to the activity type (e.g. if it's teaching, ask about teaching experience).
        
        Respond ONLY with valid JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("Failed to parse AI response");
        }

        const formStructure = JSON.parse(jsonMatch[0]);

        return NextResponse.json(formStructure);

    } catch (error: any) {
        console.error("AI Generate Form Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
