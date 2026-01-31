import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_MOCK_VOLUNTEERS, ADMIN_MOCK_ATTENDANCE } from '@/lib/adminMockData';

interface Attendee {
    id: string;
    name: string;
    email: string;
    checked_in_at?: string;
    needs_support?: 'low' | 'moderate' | 'high';
    interests?: string[];
    caregiver?: {
        name: string;
        phone: string;
        relationship: string;
    } | null;
}

interface Volunteer {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    applied_at: string;
    skills: string[];
}

interface MatchResult {
    volunteerId: string;
    volunteerName: string;
    attendeeId: string;
    attendeeName: string;
    matchScore: number;
    matchReason: string;
    skills: string[];
}

// Simple skill/interest matching algorithm
function calculateMatchScore(
    volunteerSkills: string[], 
    attendeeInterests: string[], 
    attendeeNeedsSupport: string
): { score: number; reason: string } {
    let score = 50; // Base score
    const matchingAreas: string[] = [];
    
    // Check for skill/interest overlap
    const normalizedVolSkills = volunteerSkills.map(s => s.toLowerCase());
    const normalizedInterests = attendeeInterests.map(i => i.toLowerCase());
    
    for (const skill of normalizedVolSkills) {
        for (const interest of normalizedInterests) {
            if (skill.includes(interest) || interest.includes(skill)) {
                score += 15;
                matchingAreas.push(interest);
            }
        }
    }
    
    // Bonus for specific relevant skills
    const relevantSkillKeywords = ['empathy', 'patience', 'communication', 'counseling', 'elderly care', 'teaching'];
    for (const skill of normalizedVolSkills) {
        if (relevantSkillKeywords.some(keyword => skill.includes(keyword))) {
            score += 10;
        }
    }
    
    // Adjust based on support needs
    if (attendeeNeedsSupport === 'high') {
        // High needs require experienced volunteers
        const experiencedSkills = ['leadership', 'counseling', 'first aid', 'elderly care'];
        if (normalizedVolSkills.some(s => experiencedSkills.some(e => s.includes(e)))) {
            score += 20;
        }
    }
    
    score = Math.min(100, Math.max(0, score)); // Clamp between 0-100
    
    let reason = '';
    if (matchingAreas.length > 0) {
        reason = `Matches interests: ${matchingAreas.join(', ')}`;
    } else if (score >= 70) {
        reason = 'Strong general volunteer skills';
    } else if (score >= 50) {
        reason = 'Good fit for general support';
    } else {
        reason = 'Available for assistance';
    }
    
    return { score, reason };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { attendeeIds } = body;
        
        // Get volunteers and attendees (using mock data for demo)
        const volunteers = ADMIN_MOCK_VOLUNTEERS as Volunteer[];
        const allAttendees = ADMIN_MOCK_ATTENDANCE.attendees as Attendee[];
        
        // Filter attendees if specific IDs provided
        const targetAttendees = attendeeIds && attendeeIds.length > 0
            ? allAttendees.filter((a: Attendee) => attendeeIds.includes(a.id))
            : allAttendees;
        
        const matches: MatchResult[] = [];
        
        // For each attendee, find the best volunteer matches
        for (const attendee of targetAttendees) {
            const attendeeMatches: { volunteer: Volunteer; score: number; reason: string }[] = [];
            
            for (const volunteer of volunteers) {
                const { score, reason } = calculateMatchScore(
                    volunteer.skills || [],
                    attendee.interests || [],
                    attendee.needs_support || 'low'
                );
                
                attendeeMatches.push({
                    volunteer,
                    score,
                    reason
                });
            }
            
            // Sort by score and get top matches
            attendeeMatches.sort((a, b) => b.score - a.score);
            
            // Add top 3 matches for each attendee
            for (let i = 0; i < Math.min(3, attendeeMatches.length); i++) {
                const match = attendeeMatches[i];
                matches.push({
                    volunteerId: match.volunteer.id,
                    volunteerName: match.volunteer.name,
                    attendeeId: attendee.id,
                    attendeeName: attendee.name,
                    matchScore: match.score,
                    matchReason: match.reason,
                    skills: match.volunteer.skills || []
                });
            }
        }
        
        // Group matches by attendee
        const groupedMatches: Record<string, MatchResult[]> = {};
        for (const match of matches) {
            if (!groupedMatches[match.attendeeId]) {
                groupedMatches[match.attendeeId] = [];
            }
            groupedMatches[match.attendeeId].push(match);
        }
        
        return NextResponse.json({
            success: true,
            matches: groupedMatches,
            totalMatches: matches.length,
            attendeesProcessed: targetAttendees.length
        });
        
    } catch (error: unknown) {
        console.error("AI Volunteer Matching Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to generate volunteer matches', details: errorMessage },
            { status: 500 }
        );
    }
}
