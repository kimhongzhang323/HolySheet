
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
                    title: template.title,
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

        // 5.5 Seed Form Responses for Beach Cleanup activities
        const beachCleanupActivities = insertedActivities.filter(a => a.title === 'Beach Cleanup');


        // Create sample users first - expanded list for richer data
        const formUsers = [
            { email: 'sarah.lim@example.com', name: 'Sarah Lim' },
            { email: 'john.tan@example.com', name: 'John Tan' },
            { email: 'amanda.chen@example.com', name: 'Amanda Chen' },
            { email: 'david.wong@example.com', name: 'David Wong' },
            { email: 'michelle.goh@example.com', name: 'Michelle Goh' },
            { email: 'ryan.lee@example.com', name: 'Ryan Lee' },
            { email: 'jessica.ng@example.com', name: 'Jessica Ng' },
            { email: 'marcus.teo@example.com', name: 'Marcus Teo' },
            { email: 'priya.sharma@example.com', name: 'Priya Sharma' },
            { email: 'kevin.chua@example.com', name: 'Kevin Chua' },
            { email: 'rachel.ong@example.com', name: 'Rachel Ong' },
            { email: 'daniel.lim@example.com', name: 'Daniel Lim' },
            { email: 'emily.koh@example.com', name: 'Emily Koh' },
            { email: 'jason.yeo@example.com', name: 'Jason Yeo' },
            { email: 'sophia.tan@example.com', name: 'Sophia Tan' },
            { email: 'alex.ho@example.com', name: 'Alex Ho' },
            { email: 'natalie.foo@example.com', name: 'Natalie Foo' },
            { email: 'brandon.sim@example.com', name: 'Brandon Sim' },
            { email: 'grace.low@example.com', name: 'Grace Low' },
            { email: 'timothy.chan@example.com', name: 'Timothy Chan' }
        ];

        const userIds: Record<string, string> = {};
        for (const u of formUsers) {
            const { data } = await supabase.from('users').upsert({
                email: u.email,
                name: u.name,
                role: 'user',
                image: `https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`
            }, { onConflict: 'email' }).select().single();
            if (data) userIds[u.email] = data.id;
        }

        const sampleFormData = [
            {
                email: 'sarah.lim@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Just this session',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 9123 4567',
                    'How did you hear about us?': 'Social media',
                    'Previous Experience': 'First time volunteer',
                    'Special Skills': 'Photography',
                    'Why do you want to volunteer?': 'Want to give back to the community'
                }
            },
            {
                email: 'john.tan@example.com',
                form_data: {
                    'Dietary Restrictions': 'Vegetarian',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Large',
                    'Emergency Contact': '+65 9876 5432',
                    'How did you hear about us?': 'Friend referral',
                    'Previous Experience': '2 years of volunteering at various cleanups',
                    'Special Skills': 'First Aid, Leadership',
                    'Why do you want to volunteer?': 'Passionate about environmental conservation'
                }
            },
            {
                email: 'amanda.chen@example.com',
                form_data: {
                    'Dietary Restrictions': 'Halal',
                    'Commitment Preference': 'Weekly',
                    'T-Shirt Size': 'Small',
                    'Emergency Contact': '+65 8765 4321',
                    'How did you hear about us?': 'Website',
                    'Previous Experience': 'First time volunteer',
                    'Special Skills': 'Social Media Management',
                    'Why do you want to volunteer?': 'Looking to meet like-minded people'
                }
            },
            {
                email: 'david.wong@example.com',
                form_data: {
                    'Dietary Restrictions': 'Gluten-free',
                    'Commitment Preference': 'Flexible',
                    'T-Shirt Size': 'XL',
                    'Emergency Contact': '+65 9012 3456',
                    'How did you hear about us?': 'School/University',
                    'Previous Experience': 'Organized environmental campaigns',
                    'Special Skills': 'Event coordination, First Aid',
                    'Why do you want to volunteer?': 'Marine conservation is my passion'
                }
            },
            {
                email: 'michelle.goh@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Ad-hoc',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 8234 5678',
                    'How did you hear about us?': 'Instagram',
                    'Previous Experience': '3 years at animal shelter',
                    'Special Skills': 'Team leadership, Communication',
                    'Why do you want to volunteer?': 'Expanding my volunteering experience'
                }
            },
            {
                email: 'ryan.lee@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Large',
                    'Emergency Contact': '+65 9111 2222',
                    'How did you hear about us?': 'Friend referral',
                    'Previous Experience': '5 years community service',
                    'Special Skills': 'Driving, Heavy lifting',
                    'Why do you want to volunteer?': 'Want to make a difference'
                }
            },
            {
                email: 'jessica.ng@example.com',
                form_data: {
                    'Dietary Restrictions': 'Vegetarian',
                    'Commitment Preference': 'Weekly',
                    'T-Shirt Size': 'Small',
                    'Emergency Contact': '+65 9222 3333',
                    'How did you hear about us?': 'Social media',
                    'Previous Experience': 'First time volunteer',
                    'Special Skills': 'Graphic Design',
                    'Why do you want to volunteer?': 'Looking for meaningful activities'
                }
            },
            {
                email: 'marcus.teo@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Just this session',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 9333 4444',
                    'How did you hear about us?': 'LinkedIn',
                    'Previous Experience': '1 year corporate volunteering',
                    'Special Skills': 'Project Management',
                    'Why do you want to volunteer?': 'Team building with colleagues'
                }
            },
            {
                email: 'priya.sharma@example.com',
                form_data: {
                    'Dietary Restrictions': 'Vegetarian',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 9444 5555',
                    'How did you hear about us?': 'Community center',
                    'Previous Experience': '4 years teaching',
                    'Special Skills': 'Teaching, Mentoring',
                    'Why do you want to volunteer?': 'Love working with nature'
                }
            },
            {
                email: 'kevin.chua@example.com',
                form_data: {
                    'Dietary Restrictions': 'Halal',
                    'Commitment Preference': 'Flexible',
                    'T-Shirt Size': 'Large',
                    'Emergency Contact': '+65 9555 6666',
                    'How did you hear about us?': 'School/University',
                    'Previous Experience': 'Student volunteer club leader',
                    'Special Skills': 'Video Production',
                    'Why do you want to volunteer?': 'CCA requirements and genuine interest'
                }
            },
            {
                email: 'rachel.ong@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Weekly',
                    'T-Shirt Size': 'Small',
                    'Emergency Contact': '+65 9666 7777',
                    'How did you hear about us?': 'Instagram',
                    'Previous Experience': 'Beach cleanup regular',
                    'Special Skills': 'Photography, Swimming',
                    'Why do you want to volunteer?': 'Keep our beaches beautiful'
                }
            },
            {
                email: 'daniel.lim@example.com',
                form_data: {
                    'Dietary Restrictions': 'Gluten-free',
                    'Commitment Preference': 'Ad-hoc',
                    'T-Shirt Size': 'XL',
                    'Emergency Contact': '+65 9777 8888',
                    'How did you hear about us?': 'Website',
                    'Previous Experience': 'First time volunteer',
                    'Special Skills': 'Construction, Heavy lifting',
                    'Why do you want to volunteer?': 'Try something new'
                }
            },
            {
                email: 'emily.koh@example.com',
                form_data: {
                    'Dietary Restrictions': 'Vegan',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Small',
                    'Emergency Contact': '+65 9888 9999',
                    'How did you hear about us?': 'Friend referral',
                    'Previous Experience': 'Environmental advocate',
                    'Special Skills': 'Public Speaking, Writing',
                    'Why do you want to volunteer?': 'Environmental activism'
                }
            },
            {
                email: 'jason.yeo@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Just this session',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 8111 2222',
                    'How did you hear about us?': 'Social media',
                    'Previous Experience': '2 years food distribution',
                    'Special Skills': 'Logistics, Driving',
                    'Why do you want to volunteer?': 'Help the community'
                }
            },
            {
                email: 'sophia.tan@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Flexible',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 8222 3333',
                    'How did you hear about us?': 'TikTok',
                    'Previous Experience': 'First time volunteer',
                    'Special Skills': 'Content Creation',
                    'Why do you want to volunteer?': 'Create content for awareness'
                }
            },
            {
                email: 'alex.ho@example.com',
                form_data: {
                    'Dietary Restrictions': 'Halal',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Large',
                    'Emergency Contact': '+65 8333 4444',
                    'How did you hear about us?': 'Newspaper',
                    'Previous Experience': 'Retired teacher, 10 years volunteering',
                    'Special Skills': 'Mentoring, Administration',
                    'Why do you want to volunteer?': 'Stay active in retirement'
                }
            },
            {
                email: 'natalie.foo@example.com',
                form_data: {
                    'Dietary Restrictions': 'Pescatarian',
                    'Commitment Preference': 'Weekly',
                    'T-Shirt Size': 'Small',
                    'Emergency Contact': '+65 8444 5555',
                    'How did you hear about us?': 'Instagram',
                    'Previous Experience': 'Marine biology student',
                    'Special Skills': 'Marine life identification, Research',
                    'Why do you want to volunteer?': 'Apply knowledge to real conservation'
                }
            },
            {
                email: 'brandon.sim@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Just this session',
                    'T-Shirt Size': 'XL',
                    'Emergency Contact': '+65 8555 6666',
                    'How did you hear about us?': 'Company CSR',
                    'Previous Experience': 'Corporate volunteering events',
                    'Special Skills': 'Data Analysis, Reporting',
                    'Why do you want to volunteer?': 'Company initiative'
                }
            },
            {
                email: 'grace.low@example.com',
                form_data: {
                    'Dietary Restrictions': 'Vegetarian',
                    'Commitment Preference': 'Ad-hoc',
                    'T-Shirt Size': 'Medium',
                    'Emergency Contact': '+65 8666 7777',
                    'How did you hear about us?': 'Friend referral',
                    'Previous Experience': 'Yoga instructor, wellness',
                    'Special Skills': 'First Aid, Wellness coaching',
                    'Why do you want to volunteer?': 'Combine wellness and nature'
                }
            },
            {
                email: 'timothy.chan@example.com',
                form_data: {
                    'Dietary Restrictions': 'None',
                    'Commitment Preference': 'Regular (Monthly)',
                    'T-Shirt Size': 'Large',
                    'Emergency Contact': '+65 8777 8888',
                    'How did you hear about us?': 'Website',
                    'Previous Experience': '6 years various NGOs',
                    'Special Skills': 'Fundraising, Networking',
                    'Why do you want to volunteer?': 'Expand my impact'
                }
            }
        ];

        const applicationsData = [];
        // Target specific activity by UUID
        const targetActivityId = '15983a66-8548-408d-9444-8c6008c329bd';

        for (const sample of sampleFormData) {
            const userId = userIds[sample.email];
            if (userId) {
                applicationsData.push({
                    activity_id: targetActivityId,
                    user_id: userId,
                    status: 'approved',
                    form_data: sample.form_data,
                    applied_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        }

        if (applicationsData.length > 0) {
            const { error: appError } = await supabase.from('applications').upsert(applicationsData, { onConflict: 'user_id,activity_id' });
            if (appError) {
                logs.push(`Applications insert error: ${appError.message}`);
            } else {
                logs.push(`Seeded ${applicationsData.length} form responses for Beach Cleanup activities.`);
            }
        }


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
