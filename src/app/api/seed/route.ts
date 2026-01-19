
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    try {
        const logs: string[] = [];
        logs.push(`Starting Advanced Seeding...`);

        // 1. Define Engagement Types
        const TIERS = ['Ad-hoc', 'Regular', 'Core Team'];

        // 2. Create pool of mock users for each tier
        const mockUsers = [];
        for (const tier of TIERS) {
            for (let i = 0; i < 5; i++) {
                const email = `${tier.toLowerCase().replace(' ', '')}_${i}@example.com`;
                mockUsers.push({
                    email,
                    name: `${tier} Volunteer ${i + 1}`,
                    role: 'user',
                    tier: tier, // Engagement Type
                    image: `https://ui-avatars.com/api/?name=${tier}+${i}&background=random`,
                    password: 'password123', // Dummy
                    phone_number: `+659${Math.floor(Math.random() * 10000000)}`,
                    skills: ['First Aid', 'Driving', 'Cooking', 'Teaching', 'Photography'].sort(() => 0.5 - Math.random()).slice(0, 3),
                    hours_volunteered: Math.floor(Math.random() * 50) + 10
                });
            }
        }

        logs.push(`Prepared ${mockUsers.length} mock users.`);

        // Upsert mock users
        const userIdMap: Record<string, string> = {}; // tier -> [ids]
        const tierUserIds: Record<string, string[]> = { 'Ad-hoc': [], 'Regular': [], 'Core Team': [] };

        for (const u of mockUsers) {
            const { data, error } = await supabase.from('users').upsert(u, { onConflict: 'email' }).select().single();
            if (data) {
                tierUserIds[u.tier].push(data.id);
            }
        }

        // 3. Define Activities for different timeframes (weeks ago)
        const activityTemplates = [
            {
                title: "Weekly Food Distribution",
                type: "Community",
                requirements: ["Able to lift 5kg", "Comfortable standing for 2 hours", "Team player"]
            },
            {
                title: "Senior Befriending",
                type: "Befriending",
                requirements: ["Patient and good listener", "Basic dialect knowledge is a plus", "Fully vaccinated"]
            },
            {
                title: "Beach Cleanup",
                type: "Environment",
                requirements: ["Comfortable working outdoors", "Bring own water bottle", "Able to bend and squat"]
            },
            {
                title: "Digital Workshops",
                type: "Education",
                requirements: ["Tech-savvy (Basic Smartphone/Tablet)", "Patience with elderly", "Teaching experience preferred"]
            }
        ];

        const weeksAgo = [1, 2, 3, 4];
        const insertedActivities = [];

        for (const week of weeksAgo) {
            // Determine dominant tier for this week (to limit attendance by type as requested)
            // Week 1 (Recent) -> Ad-hoc
            // Week 2 -> Regular
            // Week 3 -> Core Team
            // Week 4 -> Mixed
            let targetTier = 'Ad-hoc';
            if (week === 2) targetTier = 'Regular';
            if (week === 3) targetTier = 'Core Team';
            if (week === 4) targetTier = 'Mixed'; // All

            const date = new Date();
            date.setDate(date.getDate() - (week * 7));

            for (const template of activityTemplates) {
                const startTime = new Date(date);
                startTime.setHours(10, 0, 0, 0); // 10 AM
                const endTime = new Date(startTime);
                endTime.setHours(13, 0, 0, 0); // 1 PM

                const actPayload = {
                    title: `${template.title} (Week -${week})`,
                    description: `Historical data simulation for ${targetTier} volunteers.`,
                    activity_type: template.type,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    location: "Singapore Community Hub",
                    volunteers_needed: 20,
                    capacity: 30,
                    status: 'completed',
                    image_url: `https://picsum.photos/seed/${week}${template.type}/800/600`,
                    requirements: template.requirements
                };

                const { data: act, error } = await supabase.from('activities').insert(actPayload).select().single();
                if (act) {
                    insertedActivities.push({ ...act, targetTier });
                }
            }
        }

        logs.push(`Created/Updated ${insertedActivities.length} past activities.`);

        // 4. Generate Attendance
        const attendanceRecords = [];
        const volunteerRecords = [];

        for (const act of insertedActivities) {
            let attendeesToPick: string[] = [];

            if (act.targetTier === 'Mixed') {
                attendeesToPick = [...tierUserIds['Ad-hoc'], ...tierUserIds['Regular'], ...tierUserIds['Core Team']];
            } else {
                attendeesToPick = tierUserIds[act.targetTier] || [];
            }

            // Shuffle and pick variable amount
            attendeesToPick = attendeesToPick.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3);

            const attendeesList = [];

            for (const uid of attendeesToPick) {
                attendeesList.push(uid);

                // Add to event_volunteers
                volunteerRecords.push({
                    user_id: uid,
                    activity_id: act.id,
                    status: 'attended',
                    joined_at: act.start_time
                });

                // Add to attendance (if table exists or just simulating via attendees list update)
                // We'll update the activity 'attendees' array
            }

            // Update activity attendees array
            await supabase.from('activities').update({ attendees: attendeesList, volunteers_registered: attendeesList.length }).eq('id', act.id);
        }

        if (volunteerRecords.length > 0) {
            await supabase.from('event_volunteers').upsert(volunteerRecords, { onConflict: 'user_id,activity_id' }); // composite key usually
        }

        logs.push(`Generated ${volunteerRecords.length} attendance records distributed by tier.`);


        // 5. Ensure Specific Test User with Resume
        const testUserEmail = 'kim.hong.zhang323@gmail.com';
        const resumeData = {
            summary: "Dedicated community volunteer with over 5 years of experience in organizing local food drives and youth mentorship programs. Passionate about social equity and sustainable community development.",
            skills: [
                "Event Planning", "Youth Mentorship", "Food Safety Handling",
                "First Aid Certified", "Public Speaking", "Team Leadership",
                "Fundraising", "Conflict Resolution"
            ],
            experience: [
                {
                    role: "Lead Coordinator",
                    organization: "Community Food Bank",
                    period: "2021 - Present",
                    description: "Organized weekly food distribution for 200+ families. Managed a team of 15 volunteers and coordinated logistics with local suppliers."
                },
                {
                    role: "Youth Mentor",
                    organization: "Future Leaders Program",
                    period: "2019 - 2021",
                    description: "Mentored high-risk youths aged 14-17. Facilitated weekly workshops on career development and emotional intelligence."
                }
            ],
            education: [
                {
                    degree: "Bachelor of Social Work",
                    institution: "National University of Singapore",
                    year: "2018"
                }
            ],
            certifications: [
                {
                    name: "Standard First Aid + AED",
                    issuer: "Singapore Red Cross",
                    year: "2023"
                },
                {
                    name: "Volunteer Management 101",
                    issuer: "NCSS",
                    year: "2022"
                }
            ],
            availability: "Weekends, Tuesday Evenings",
            interests: ["Elderly Care", "Youth Education", "Environmental Sustainability"]
        };

        const { error: userError } = await supabase.from('users').upsert({
            email: testUserEmail,
            name: "Kim Hong",
            phone_number: "+6591234567", // Valid for WhatsApp testing
            role: 'user',
            image: "https://ui-avatars.com/api/?name=Kim+Hong&background=0D8ABC&color=fff",
            resume_json: resumeData,
            hours_volunteered: 120,
            skills: resumeData.skills
        }, { onConflict: 'email' });

        if (userError) {
            console.error("Failed to seed test user:", userError);
            logs.push(`Failed to seed test user: ${userError.message}`);
        } else {
            logs.push(`Seeded specific user: ${testUserEmail} with Resume JSON.`);
        }

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
