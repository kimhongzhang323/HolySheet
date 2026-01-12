import { GoogleGenAI } from '@google/genai';
import dbConnect from '@/lib/db';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

export async function POST(req: Request) {
    await dbConnect();

    const { messages } = await req.json();

    // Build conversation history for multi-turn
    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    try {
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            history,
            config: {
                systemInstruction: `You are Daty, a helpful AI assistant for HolySheet activity hub. 
You help users find events, check schedules, and answer questions about activities.
Be concise and friendly.`,
            }
        });

        const response = await chat.sendMessageStream({ message: lastMessage.content });

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Chat error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
