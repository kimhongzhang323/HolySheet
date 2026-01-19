import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const targetEmail = searchParams.get('email') || 'kim.hong.zhang323@gmail.com';

        const logs: string[] = [];
        logs.push(`Starting Supabase Seed for ${targetEmail}...`);

        // 1. Get or Create User
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', targetEmail)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            throw new Error(`Failed to fetch user: ${userError.message}`);
        }

        if (!user) {
            logs.push("User not found, creating...");
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

        if (user) logs.push(`User found/created: ${user.id}`);

        // 2. Clear existing bookings and applications for this user
        if (user) {
            await supabase.from('event_volunteers').delete().eq('user_id', user.id);
            await supabase.from('applications').delete().eq('user_id', user.id);
        }

        // 3. Create/Ensure Activities
        const VOLUNTEER_ACTIVITIES = [
            {
                title: 'CARE CIRCLE',
                type: 'VOLUNTEER',
                activity_type: 'Care Circle',
                category: 'befriending',
                engagement_frequency: 'once_week',
                organizer: 'MINDS Care Circle Programme',
                organizer_label: 'Programme',
                description: 'Be a friend to persons with intellectual disabilities (PWIDs). Build meaningful relationships through regular befriending sessions, activities, and community outings. Training provided for all new volunteers.',
                location: 'MINDS Hub (Clementi)',
                schedule: 'Every Saturday, 10:00 AM - 1:00 PM',
                start_time: '2026-01-18T10:00:00Z',
                end_time: '2026-01-18T13:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop',
                requirements: ['18 years and above', 'Commit for at least 6 months'],
                tags: ['BEFRIENDING', 'PWID', 'COMMUNITY'],
                volunteers_needed: 10,
                capacity: 20
            },
            {
                title: 'WEEKDAY HUB',
                type: 'VOLUNTEER',
                activity_type: 'Hub Support',
                category: 'hub',
                engagement_frequency: 'three_plus_week',
                organizer: 'MINDS Community Hub',
                organizer_label: 'Centre',
                description: 'Support Training Officers during daily programmes and activities. Assist with arts & crafts, music sessions, sports activities, and life skills training for PWIDs.',
                location: 'MINDS Hub (Ang Mo Kio)',
                schedule: 'Mon-Fri, 9:00 AM - 4:00 PM (Flexible)',
                start_time: '2026-01-20T09:00:00Z',
                end_time: '2026-01-20T16:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
                requirements: ['Weekday availability', 'Patient and caring nature'],
                tags: ['HUB', 'TRAINING', 'ACTIVITIES'],
                volunteers_needed: 5,
                capacity: 15
            },
            {
                title: 'WEEKEND MYG',
                type: 'BEFRIENDER',
                activity_type: 'Befriending',
                category: 'befriending',
                engagement_frequency: 'once_week',
                organizer: 'MINDS Youth Group',
                organizer_label: 'Programme',
                description: 'Join the MINDS Youth Group as a weekend befriender! Engage young adults with intellectual disabilities through fun recreational activities, games, and social outings.',
                location: 'Various Locations',
                schedule: 'Saturdays OR Sundays, 2:00 PM - 5:00 PM',
                start_time: '2026-01-25T14:00:00Z',
                end_time: '2026-01-25T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
                requirements: ['Weekend availability', 'Age 18-35 preferred'],
                tags: ['YOUTH', 'BEFRIENDING', 'RECREATION'],
                volunteers_needed: 10,
                capacity: 25
            },
            {
                title: 'HOME BEFRIENDING',
                type: 'BEFRIENDER',
                activity_type: 'Befriending',
                category: 'befriending',
                engagement_frequency: 'once_week',
                organizer: 'Me Too! Club',
                organizer_label: 'Programme',
                description: 'Visit PWIDs at their homes and build a lasting friendship. Engage in conversations, simple activities, and provide companionship to those who may have limited social interactions.',
                location: 'Client Homes (Islandwide)',
                schedule: 'Flexible - 2 hours per week',
                start_time: '2026-01-22T10:00:00Z',
                end_time: '2026-01-22T12:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1581578731522-8618e860953a?w=800&h=600&fit=crop',
                requirements: ['Commit for at least 1 year', 'Background check required'],
                tags: ['HOME VISIT', 'BEFRIENDING', 'COMPANIONSHIP'],
                volunteers_needed: 15,
                capacity: 30
            },
            {
                title: 'ME TOO! CLUB',
                type: 'ACTIVITY',
                activity_type: 'Hub Support',
                category: 'hub',
                engagement_frequency: 'twice_week',
                organizer: 'Me Too! Club',
                organizer_label: 'Centre',
                description: 'Support rehabilitative activities at Me Too! Club. Help facilitate arts, music therapy, exercise sessions, and social skills programmes for PWIDs.',
                location: 'Me Too! Club',
                schedule: 'Tue & Thu, 2:00 PM - 5:00 PM',
                start_time: '2026-01-21T14:00:00Z',
                end_time: '2026-01-21T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
                requirements: ['Twice weekly commitment', 'Interest in therapeutic activities'],
                tags: ['REHABILITATION', 'ACTIVITIES', 'THERAPY'],
                volunteers_needed: 6,
                capacity: 12
            },
            {
                title: 'GRAPHIC DESIGNER',
                type: 'DESIGNER',
                activity_type: 'Creative',
                category: 'skills',
                engagement_frequency: 'adhoc',
                organizer: 'MINDS Communications',
                organizer_label: 'Department',
                description: 'Use your creative skills to design marketing materials, event posters, social media graphics, and newsletters for MINDS.',
                location: 'Remote',
                schedule: 'Flexible - Project Based',
                start_time: '2026-02-01T09:00:00Z',
                end_time: '2026-02-01T18:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
                requirements: ['Proficiency in design software', 'Portfolio required'],
                tags: ['DESIGN', 'CREATIVE', 'REMOTE'],
                volunteers_needed: 3,
                capacity: 5
            },
            {
                title: 'PHOTO VOLUNTEER',
                type: 'VOLUNTEER',
                activity_type: 'Creative',
                category: 'skills',
                engagement_frequency: 'adhoc',
                organizer: 'MINDS Communications',
                organizer_label: 'Department',
                description: 'Capture meaningful moments at MINDS events and activities. Help document the journey of PWIDs through photography.',
                location: 'Various Locations',
                start_time: '2026-02-15T09:00:00Z',
                end_time: '2026-02-15T17:00:00Z',
                image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
                requirements: ['Own camera equipment', 'Event photography experience'],
                tags: ['PHOTOGRAPHY', 'EVENTS', 'DOCUMENTATION'],
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

            logs.push(`Checking activity: ${act.title}`);
            const { data: existing, error: findError } = await supabase.from('activities').select('id').eq('title', act.title).maybeSingle();

            if (findError) {
                logs.push(`Error searching for ${act.title}: ${findError.message}`);
            }

            if (existing) {
                logs.push(`Updating existing activity: ${act.title} (${existing.id})`);
                const { data: updated, error: upError } = await supabase.from('activities').update(payload).eq('id', existing.id).select().single();
                if (updated) {
                    logs.push(`Successfully updated: ${act.title}`);
                    createdActivities.push(updated);
                } else {
                    logs.push(`Failed to update activity ${act.title}: ${upError?.message || 'Unknown error'}`);
                }
            } else {
                logs.push(`Inserting new activity: ${act.title}`);
                const { data: inserted, error: insError } = await supabase.from('activities').insert(payload).select().single();
                if (inserted) {
                    logs.push(`Successfully inserted: ${act.title}`);
                    createdActivities.push(inserted);
                } else {
                    logs.push(`Failed to insert activity ${act.title}: ${insError?.message || 'Unknown error'}`);
                }
            }
        }

        // 4. Create Bookings and Applications
        let hours = 0;
        let missions = 0;
        const bookings = [];
        const applications = [];

        if (user && createdActivities.length > 0) {
            for (let idx = 0; idx < createdActivities.length; idx++) {
                const act = createdActivities[idx];
                if (!act || !act.end_time) continue;

                const actDate = new Date(act.end_time);
                const isPast = actDate < new Date();

                let status = 'confirmed';
                if (isPast) {
                    status = 'attended';
                } else if (idx % 3 === 0) {
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
                    status: status === 'attended' ? 'approved' : status,
                    applied_at: new Date().toISOString()
                });

                if (status === 'attended') {
                    missions++;
                    const duration = (new Date(act.end_time).getTime() - new Date(act.start_time).getTime()) / (1000 * 3600);
                    hours += duration;
                }
            }

            if (bookings.length > 0) {
                const { error: bookingError } = await supabase.from('event_volunteers').insert(bookings);
                if (bookingError) logs.push(`Failed to insert bookings: ${bookingError.message}`);
            }

            if (applications.length > 0) {
                const { error: appError } = await supabase.from('applications').insert(applications);
                if (appError) logs.push(`Applications insert failed: ${appError.message}`);
            }

            // 5. Update User Stats
            await supabase.from('users').update({
                hours_volunteered: Math.round(hours),
                missions_completed: missions
            }).eq('id', user.id);
        }

        return NextResponse.json({
            success: true,
            message: `Seeded Supabase for ${user?.email}. Created/Updated ${createdActivities.length} activities. Stats: ${missions} missions, ${hours} hours.`,
            logs
        });

    } catch (error: any) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
