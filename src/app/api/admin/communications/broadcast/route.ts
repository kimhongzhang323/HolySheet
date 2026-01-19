
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getClient, getClientStatus, initializeWhatsapp } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, activityId, targetFilter, testNumber } = body;

        // 1. Initialize/Get Client
        const client = getClient();
        const status = getClientStatus();

        // 2. Auth Check
        if (!status.isReady) {
            return NextResponse.json({
                success: false,
                error: 'WhatsApp not connected',
                needsAuth: true,
                qr: status.qr
            }, { status: 200 });
        }

        if (!message) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // 3. Fetch Users
        // 3. Determine Recipients
        let validUsers: any[] = [];

        if (testNumber) {
            // TEST MODE: Override with single recipient
            validUsers = [{ id: 'test', name: 'Test User', phone_number: testNumber }];
        } else {
            // DATA DRIVEN: Fetch from DB
            let query = supabase.from('users').select('id, name, phone_number, skills, hours_volunteered');

            // Filter Logic
            if (targetFilter === 'skills' && activityId) {
                // Fetch activity to know what skills to match
                const { data: activity } = await supabase.from('activities').select('activity_type').eq('id', activityId).single();
                if (activity && activity.activity_type) {
                    // Match users who have this skill
                    // Note: This assumes exact match between activity_type and skill name, or simple string match
                    query = query.contains('skills', [activity.activity_type]);
                }
            } else if (targetFilter === 'previous') {
                // Users who have volunteered before
                query = query.gt('hours_volunteered', 0);
            }

            query = query.not('phone_number', 'is', null);
            const { data: users, error } = await query;
            if (error) throw error;
            validUsers = users.filter((u: any) => u.phone_number && u.phone_number.length > 7);
        }

        if (validUsers.length === 0) {
            return NextResponse.json({ message: 'No valid recipients found.', count: 0 });
        }

        if (!client) {
            return NextResponse.json({ error: 'Client lost connection' }, { status: 500 });
        }

        // 4. Send Messages
        const results = await Promise.allSettled(validUsers.map(async (user: any) => {
            const rawNumber = user.phone_number.replace(/\D/g, ''); // Remove non-digits

            try {
                // Verify number exists on WhatsApp
                const numberId = await client.getNumberId(rawNumber);

                if (!numberId) {
                    throw new Error(`Number ${rawNumber} not registered on WhatsApp`);
                }

                const personalizedMsg = `Hi ${user.name}, ${message}`;
                await client.sendMessage(numberId._serialized, personalizedMsg);
                return { name: user.name, number: rawNumber, status: 'sent' };

            } catch (err: any) {
                console.error(`Error sending to ${user.name} (${rawNumber}):`, err.message);
                throw new Error(`${user.name}: ${err.message}`);
            }
        }));

        const sentCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;

        // Collect error details
        const errors = results
            .filter(r => r.status === 'rejected')
            .map((r: any) => r.reason.message);

        return NextResponse.json({
            success: sentCount > 0, // Considered success if at least one sent? Or partial success.
            message: `Sent to ${sentCount}/${validUsers.length} volunteers.`,
            count: sentCount,
            failures: failedCount,
            errorDetails: errors.slice(0, 5) // Return first 5 errors to avoid huge payload
        });

    } catch (error: any) {
        console.error('Broadcast Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
