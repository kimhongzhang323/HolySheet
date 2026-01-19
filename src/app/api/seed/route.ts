import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const targetEmail = searchParams.get('email') || 'volunteer20@holysheet.com';

        console.log(`Starting Supabase Seed for ${targetEmail}...`);

        // 1. Get or Create User
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail)
            .single();

        if (!user) {
            console.log("User not found, creating...");
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email: targetEmail,
                    name: 'Elizabeth Taylor',
                    role: 'user',
                    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth',
                    hours_volunteered: 0,
                    missions_completed: 0,
                    bio: 'Passionate senior volunteer with a focus on community art and youth education.',
                    location: 'Singapore, North',
                    phone_number: '+65 8765 4321',
                    skills: ['Art Direction', 'Teaching', 'Event Planning'],
                    interests: ['Community', 'Education', 'Arts'],
                    achievements: [
                        { name: 'Community Pillar', description: 'Completed 10 community missions.', icon: 'Award', color: 'text-emerald-500' },
                        { name: 'Helper of the Month', description: 'Most hours in January.', icon: 'Star', color: 'text-amber-500' }
                    ],
                    resume_json: {
                        summary: 'Experienced community lead and dedicated volunteer with over 5 years of service in education and environmental outreach.',
                        experience: [
                            { role: 'Volunteer Coordinator', organization: 'Green Singapore', period: '2021 - Present' },
                            { role: 'Teaching Assistant', organization: 'Vibrant Minds', period: '2019 - 2021' }
                        ],
                        education: 'Bachelor of Social Work, National University of Singapore'
                    },
                    password: 'hashed_password123'
                })
                .select()
                .single();

            if (createError) throw new Error(`Failed to create user: ${createError.message}`);
            user = newUser;
        }

        // 2. Clear existing data for this user
        if (user) {
            await supabase.from('event_volunteers').delete().eq('user_id', user.id);
            await supabase.from('applications').delete().eq('user_id', user.id); // Clear applications too
        }

        // 3. Create/Ensure Activities (Past, Future, Pending)
        const locations = ['MINDS Clementi', 'MINDS Ang Mo Kio', 'East Coast Park', 'Bedok CC', 'Jurong Library'];
        const titles = ['Art Therapy', 'Beach Cleanup', 'Food Distribution', 'Tech Workshop', 'Reading Session'];

        const activities = [];
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;

        // i from -3 to 5 to get a mix
        for (let i = -3; i <= 5; i++) {
            if (i === 0) continue;
            const rndTitle = titles[Math.floor(Math.random() * titles.length)];
            const rndLoc = locations[Math.floor(Math.random() * locations.length)];

            activities.push({
                title: `${rndTitle} ${Math.abs(i)}`,
                description: `Join us for ${rndTitle} at ${rndLoc}. A great opportunity to give back.`,
                start_time: new Date(now + (i * 3 * DAY)).toISOString(),
                end_time: new Date(now + (i * 3 * DAY) + (4 * 3600 * 1000)).toISOString(),
                location: rndLoc,
                capacity: 20,
                volunteers_needed: 10,
                image_url: `https://picsum.photos/seed/${rndTitle}${i}/400/300`,
                allowed_tiers: ['ad-hoc', 'once-a-week'],
                category: i % 2 === 0 ? 'Community' : 'Education'
            });
        }

        // Upsert activities
        const createdActivities = [];
        for (const act of activities) {
            const { data: existing } = await supabase.from('activities').select('id').eq('title', act.title).single();

            if (existing) {
                const { data: updated } = await supabase.from('activities').update(act).eq('id', existing.id).select().single();
                if (updated) createdActivities.push(updated);
            } else {
                const { data: inserted, error: insError } = await supabase.from('activities').insert(act).select().single();
                if (inserted) createdActivities.push(inserted);
                else console.error(`Failed to insert activity ${act.title}:`, insError?.message);
            }
        }

        // 4. Create Bookings (event_volunteers) and Applications
        let hours = 0;
        let missions = 0;

        const bookings = [];
        const applications = [];

        for (let idx = 0; idx < createdActivities.length; idx++) {
            const act = createdActivities[idx];
            if (!act || !act.end_time) continue;

            const actDate = new Date(act.end_time);
            const isPast = actDate < new Date();

            // Assign statuses: past -> attended, some future -> confirmed, some future -> pending
            let status = 'confirmed';
            if (isPast) {
                status = 'attended';
            } else if (idx % 3 === 0) { // Some future ones are pending
                status = 'pending';
            }

            bookings.push({
                user_id: user.id,
                activity_id: act.id,
                status: status,
                joined_at: new Date().toISOString()
            });

            applications.push({
                user_id: user.id,
                activity_id: act.id,
                status: status === 'attended' ? 'approved' : status, // Applications are 'approved' if attended, otherwise mirror booking status
                applied_at: new Date().toISOString()
            });

            if (status === 'attended') {
                missions++;
                const duration = (new Date(act.end_time).getTime() - new Date(act.start_time).getTime()) / (1000 * 3600);
                hours += duration;
            }
        }

        const { error: bookingError } = await supabase.from('event_volunteers').insert(bookings);
        if (bookingError) throw new Error(`Failed to insert bookings: ${bookingError.message}`);

        const { error: appError } = await supabase.from('applications').insert(applications);
        if (appError) console.warn('Applications table insert failed (maybe table not created yet):', appError.message);


        // 5. Update User Stats
        await supabase.from('users').update({
            hours_volunteered: Math.round(hours),
            missions_completed: missions
        }).eq('id', user.id);

        return NextResponse.json({
            success: true,
            message: `Seeded Supabase for ${user.email}. Created ${createdActivities.length} activities. Stats: ${missions} missions, ${hours} hours.`
        });

    } catch (error: any) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
