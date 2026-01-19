import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const session = await auth();

        // Feedback can be anonymous or from registered users
        const body = await req.json();
        const { type, rating, message, image_url } = body;

        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: session?.user?.id || null,
                user_email: session?.user?.email || null,
                type,
                rating,
                message,
                image_url,
            });

        if (error) {
            console.error('Supabase feedback insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
