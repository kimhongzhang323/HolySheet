import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const targetEmail = searchParams.get('email') || 'kim.hong.zhang323@gmail.com';

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
                    name: 'Kim Hong Zhang',
                    role: 'user',
                    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KimHong',
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

        // 3. Create/Ensure Activities (Real Mock Data from Frontend)
        const VOLUNTEER_ACTIVITIES = [
            {
                title: 'CARE CIRCLE',
                type: 'VOLUNTEER',
                activityType: 'Care Circle',
                category: 'befriending',
                description: 'Be a friend to persons with intellectual disabilities (PWIDs). Build meaningful relationships through regular befriending sessions, activities, and community outings.',
                location: 'MINDS Hub (Clementi)',
                start_time: '2026-01-18T10:00:00Z',
                end_time: '2026-01-18T13:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop',
                requirements: ['18 years and above', 'Commit for at least 6 months', 'Attend orientation session'],
                volunteers_needed: 10,
                capacity: 20
            },
            {
                title: 'WEEKDAY HUB',
                type: 'VOLUNTEER',
                activityType: 'Hub Support',
                category: 'hub',
                description: 'Support Training Officers during daily programmes and activities. Assist with arts & crafts, music sessions, sports activities, and life skills training for PWIDs.',
                location: 'MINDS Hub (Ang Mo Kio)',
                start_time: '2026-01-20T09:00:00Z',
                end_time: '2026-01-20T16:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
                requirements: ['Weekday availability', 'Patient and caring nature', 'Able to commit at least 3 hours per session'],
                volunteers_needed: 5,
                capacity: 15
            },
            {
                title: 'WEEKEND MYG',
                type: 'BEFRIENDER',
                category: 'befriending',
                description: 'Join the MINDS Youth Group as a weekend befriender! Engage young adults with intellectual disabilities through fun recreational activities, games, and social outings.',
                location: 'Various Locations',
                start_time: '2026-01-25T14:00:00Z',
                end_time: '2026-01-25T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
                requirements: ['Weekend availability', 'Age 18-35 preferred', 'Commit for at least 6 months'],
                volunteers_needed: 10,
                capacity: 25
            },
            {
                title: 'HOME BEFRIENDING',
                type: 'BEFRIENDER',
                category: 'befriending',
                description: 'Visit PWIDs at their homes and build a lasting friendship. Engage in conversations, simple activities, and provide companionship to those who may have limited social interactions.',
                location: 'Client Homes (Islandwide)',
                start_time: '2026-01-22T10:00:00Z',
                end_time: '2026-01-22T12:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1581578731522-8618e860953a?w=800&h=600&fit=crop',
                requirements: ['Commit for at least 1 year', 'Background check required', 'Attend mandatory training'],
                volunteers_needed: 15,
                capacity: 30
            },
            {
                title: 'ME TOO! CLUB',
                type: 'ACTIVITY',
                activityType: 'Hub Support',
                category: 'hub',
                description: 'Support rehabilitative activities at Me Too! Club. Help facilitate arts, music therapy, exercise sessions, and social skills programmes for PWIDs.',
                location: 'Me Too! Club',
                start_time: '2026-01-21T14:00:00Z',
                end_time: '2026-01-21T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
                requirements: ['Twice weekly commitment', 'Interest in therapeutic activities'],
                volunteers_needed: 6,
                capacity: 12
            },
            {
                title: 'GRAPHIC DESIGNER',
                type: 'DESIGNER',
                activityType: 'Creative',
                category: 'skills',
                description: 'Use your creative skills to design marketing materials, event posters, social media graphics, and newsletters for MINDS.',
                location: 'Remote',
                start_time: '2026-02-01T09:00:00Z',
                end_time: '2026-02-01T18:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
                requirements: ['Proficiency in design software', 'Portfolio required'],
                volunteers_needed: 3,
                capacity: 5
            },
            {
                title: 'PHOTO VOLUNTEER',
                type: 'VOLUNTEER',
                activityType: 'Creative',
                category: 'skills',
                description: 'Capture meaningful moments at MINDS events and activities. Help document the journey of PWIDs through photography.',
                location: 'Various Locations',
                start_time: '2026-02-15T09:00:00Z',
                end_time: '2026-02-15T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
                requirements: ['Own camera equipment', 'Event photography experience'],
                volunteers_needed: 4,
                capacity: 8
            }
        ];

        const defaultForm = {
            title: "Volunteer Application",
            description: "Please provide a few details to help us prepare for your visit.",
            fields: [
                { label: "Emergency Contact Name", type: "text", required: true },
                { label: "Emergency Contact Number", type: "tel", required: true },
                { label: "Dietary Restrictions", type: "select", required: false, options: ["None", "Vegetarian", "Vegan", "Halal", "Gluten-Free"] },
                { label: "Why do you want to join this mission?", type: "textarea", required: true }
            ]
        };

        const createdActivities = [];
        for (const act of VOLUNTEER_ACTIVITIES) {
            const payload = {
                ...act,
                image_url: `https://picsum.photos/seed/${encodeURIComponent(act.title)}/800/600`,
                volunteer_form: { ...defaultForm, title: `Application: ${act.title}` }
            };

            const { data: existing } = await supabase.from('activities').select('id').eq('title', act.title).single();

            if (existing) {
                const { data: updated } = await supabase.from('activities').update(payload).eq('id', existing.id).select().single();
                if (updated) createdActivities.push(updated);
            } else {
                const { data: inserted, error: insError } = await supabase.from('activities').insert(payload).select().single();
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
