
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

        const body = await req.json();
        const { activityTitle, platforms } = body;

        if (!activityTitle) {
            return NextResponse.json({ error: "Missing activity title" }, { status: 400 });
        }

        const prompt = `You are a social media manager for a non-profit organization.
        Write a catchy, engaging social media blast to recruit volunteers for an event titled "${activityTitle}".

        Target Platforms: ${platforms.join(', ')}.

        Requirements:
        1. Create a SINGLE unified caption that works well across these platforms.
        2. Keep it energetic, urgent, and inviting.
        3. Include 5-10 relevant, high-reach hashtags at the end.
        4. Use emojis.
        5. The total length should be suitable for Instagram/Facebook (under 280 chars is great for X too, but prioritize engagement).

        Return ONLY the raw text of the caption and hashtags. Do not include "Caption:" or other labels.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt
        });

        const text = response.text || '';
        return NextResponse.json({ content: text.trim() });

    } catch (error: any) {
        console.error("AI Social Content Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
