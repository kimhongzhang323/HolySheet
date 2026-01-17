'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowLeft, Calendar, Clock, Users, Share2, Heart, CheckCircle,
    X, AlertCircle, FileText, Send
} from 'lucide-react';

// Volunteer Activities - matches the main events page
const VOLUNTEER_ACTIVITIES = [
    {
        _id: 'VOL001',
        title: 'CARE CIRCLE',
        type: 'VOLUNTEER',
        activityType: 'Care Circle',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'MINDS Care Circle Programme',
        organizerLabel: 'Programme',
        description: 'Be a friend to persons with intellectual disabilities (PWIDs). Build meaningful relationships through regular befriending sessions, activities, and community outings.',
        fullDescription: `Be a friend to persons with intellectual disabilities (PWIDs) through our Care Circle Programme!

**What to expect:**
- One-on-one or group befriending sessions
- Engaging activities including arts, games, and music
- Community outings and excursions
- Building lasting, meaningful friendships

**Training provided:**
- Orientation on working with PWIDs
- Communication techniques
- Safety and emergency procedures

**Commitment:**
- Minimum 6-month commitment
- Weekly sessions on Saturdays`,
        location: 'MINDS Hub (Clementi)',
        schedule: 'Every Saturday, 10:00 AM - 1:00 PM',
        start_time: '10:00',
        end_time: '13:00',
        date: '18',
        month: 'JANUARY',
        year: '2026',
        tags: ['BEFRIENDING', 'PWID', 'COMMUNITY'],
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop',
        requirements: ['18 years and above', 'Commit for at least 6 months', 'Attend orientation session'],
    },
    {
        _id: 'VOL002',
        title: 'WEEKDAY HUB',
        type: 'VOLUNTEER',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'three_plus_week',
        organizer: 'MINDS Community Hub',
        organizerLabel: 'Centre',
        description: 'Support Training Officers during daily programmes and activities. Assist with arts & crafts, music sessions, sports activities, and life skills training for PWIDs.',
        fullDescription: `Join our team of dedicated volunteers at MINDS Community Hub!

**Your role includes:**
- Assisting Training Officers with daily programmes
- Helping with arts & crafts activities
- Supporting music and movement sessions
- Guiding sports and recreational activities
- Assisting with life skills training

**Benefits:**
- Flexible volunteering hours
- Direct impact on PWIDs' daily lives
- Skill development opportunities
- Certificate of appreciation`,
        location: 'MINDS Hub (Ang Mo Kio)',
        schedule: 'Mon-Fri, 9:00 AM - 4:00 PM (Flexible)',
        start_time: '09:00',
        end_time: '16:00',
        date: '20',
        month: 'JANUARY',
        year: '2026',
        tags: ['HUB', 'TRAINING', 'ACTIVITIES'],
        spotsLeft: 5,
        image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
        requirements: ['Weekday availability', 'Patient and caring nature', 'Able to commit at least 3 hours per session'],
    },
    {
        _id: 'VOL003',
        title: 'WEEKEND MYG',
        type: 'BEFRIENDER',
        activityType: 'Befriending',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'MINDS Youth Group',
        organizerLabel: 'Programme',
        description: 'Join the MINDS Youth Group as a weekend befriender! Engage young adults with intellectual disabilities through fun recreational activities, games, and social outings.',
        fullDescription: `Be part of the MINDS Youth Group (MYG) as a weekend befriender!

**Activities include:**
- Sports and games sessions
- Arts and crafts workshops
- Community outings (movies, parks, etc.)
- Social skill building activities
- Special events and celebrations

**Why join MYG:**
- Connect with young adults with intellectual disabilities
- Build meaningful friendships
- Develop leadership skills
- Be part of a vibrant volunteer community`,
        location: 'Various Locations',
        schedule: 'Saturdays OR Sundays, 2:00 PM - 5:00 PM',
        start_time: '14:00',
        end_time: '17:00',
        date: '25',
        month: 'JANUARY',
        year: '2026',
        tags: ['YOUTH', 'BEFRIENDING', 'RECREATION'],
        spotsLeft: 12,
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
        requirements: ['Weekend availability', 'Age 18-35 preferred', 'Commit for at least 6 months'],
    },
    {
        _id: 'VOL004',
        title: 'HOME',
        type: 'BEFRIENDER',
        activityType: 'Befriending',
        category: 'befriending',
        engagementFrequency: 'once_week',
        organizer: 'Me Too! Club',
        organizerLabel: 'Programme',
        description: 'Visit PWIDs at their homes and build a lasting friendship. Engage in conversations, simple activities, and provide companionship to those who may have limited social interactions.',
        fullDescription: `Make a difference through home befriending visits!

**Your role:**
- Visit PWIDs at their homes weekly
- Engage in conversations and simple activities
- Provide companionship and emotional support
- Help with basic social skill building
- Report progress to programme coordinators

**What we provide:**
- Comprehensive training before starting
- Ongoing support from staff
- Regular volunteer gatherings
- Recognition and appreciation`,
        location: 'Client Homes (Islandwide)',
        schedule: 'Flexible - 2 hours per week',
        start_time: '10:00',
        end_time: '12:00',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['HOME VISIT', 'BEFRIENDING', 'COMPANIONSHIP'],
        spotsLeft: 15,
        image: 'https://picsum.photos/seed/home-befriend/400/600',
        requirements: ['Commit for at least 1 year', 'Background check required', 'Attend mandatory training'],
    },
    {
        _id: 'VOL005',
        title: 'ME TOO! CLUB',
        type: 'ACTIVITY',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'twice_week',
        organizer: 'Me Too! Club',
        organizerLabel: 'Centre',
        description: 'Support rehabilitative activities at Me Too! Club. Help facilitate arts, music therapy, exercise sessions, and social skills programmes for PWIDs.',
        fullDescription: `Join the Me Too! Club volunteer team!

**Activities you'll support:**
- Art therapy sessions
- Music and movement therapy
- Exercise and wellness programmes
- Social skills training
- Meal preparation activities

**Schedule:**
- Tuesday and Thursday sessions
- Flexible timing within 2-5 PM
- Minimum twice weekly commitment`,
        location: 'Me Too! Club',
        schedule: 'Tue & Thu, 2:00 PM - 5:00 PM',
        start_time: '14:00',
        end_time: '17:00',
        date: '21',
        month: 'JANUARY',
        year: '2026',
        tags: ['REHABILITATION', 'ACTIVITIES', 'THERAPY'],
        spotsLeft: 6,
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
        requirements: ['Twice weekly commitment', 'Interest in therapeutic activities', 'Patient and empathetic'],
    },
    {
        _id: 'VOL006',
        title: 'GRAPHIC',
        type: 'DESIGNER',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Use your creative skills to design marketing materials, event posters, social media graphics, and newsletters for MINDS. Work remotely on project basis.',
        fullDescription: `Contribute your design skills to MINDS!

**Projects include:**
- Event posters and banners
- Social media graphics
- Newsletter layouts
- Marketing brochures
- Digital assets

**Requirements:**
- Proficiency in Adobe Creative Suite or Canva
- Understanding of brand guidelines
- Portfolio of previous work

**Perks:**
- Flexible remote work
- Portfolio building opportunity
- Work with a social impact organisation`,
        location: 'Remote',
        schedule: 'Flexible - Project Based',
        start_time: 'Flexible',
        end_time: 'Flexible',
        date: '01',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['DESIGN', 'CREATIVE', 'REMOTE'],
        spotsLeft: 3,
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
        requirements: ['Proficiency in design software', 'Portfolio required', 'Responsive communication'],
    },
    {
        _id: 'VOL007',
        title: 'PHOTO',
        type: 'VOLUNTEER',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Capture meaningful moments at MINDS events and activities. Help document the journey of PWIDs and create lasting memories through photography.',
        fullDescription: `Capture the moments that matter!

**Coverage includes:**
- Annual events and celebrations
- Daily activity highlights
- Special programmes
- Graduation ceremonies
- Outings and excursions

**What to bring:**
- Your own camera equipment
- Memory cards and batteries
- Creative eye and patience`,
        location: 'Various Locations',
        schedule: 'Event-based',
        start_time: '09:00',
        end_time: '17:00',
        date: '15',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['PHOTOGRAPHY', 'EVENTS', 'DOCUMENTATION'],
        spotsLeft: 4,
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
        requirements: ['Own camera equipment', 'Event photography experience', 'Comfortable working with PWIDs'],
    },
    {
        _id: 'VOL008',
        title: 'VIDEO',
        type: 'EDITOR',
        activityType: 'Creative',
        category: 'skills',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Communications',
        organizerLabel: 'Department',
        description: 'Create compelling video content for MINDS. Edit event highlights, testimonial videos, and promotional content to raise awareness about PWIDs.',
        fullDescription: `Create videos that tell our story!

**Video types:**
- Event highlight reels
- Testimonial interviews
- Promotional videos
- Social media content
- Documentary-style features

**Software:**
- Adobe Premiere Pro / Final Cut Pro
- After Effects for motion graphics
- Basic color grading skills`,
        location: 'Remote',
        schedule: 'Flexible - Project Based',
        start_time: 'Flexible',
        end_time: 'Flexible',
        date: '01',
        month: 'MARCH',
        year: '2026',
        tags: ['VIDEO', 'EDITING', 'CONTENT'],
        spotsLeft: 2,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop',
        requirements: ['Video editing software proficiency', 'Showreel required', 'Meet project deadlines'],
    },
    {
        _id: 'VOL009',
        title: 'GROUP',
        type: 'OUTING',
        activityType: 'Excursion',
        category: 'outings',
        engagementFrequency: 'adhoc',
        organizer: 'MINDS Community Outreach',
        organizerLabel: 'Programme',
        description: 'Accompany PWIDs on exciting community outings! Visit parks, museums, shopping malls, and recreational venues. Help create joyful experiences outside the hub.',
        fullDescription: `Join us for community outings!

**Destinations include:**
- Parks and nature reserves
- Museums and exhibitions
- Shopping malls
- Recreational venues
- Special event locations

**Your role:**
- Accompany and assist PWIDs
- Ensure safety during outings
- Facilitate social interactions
- Create joyful experiences`,
        location: 'Various Locations',
        schedule: 'Monthly - Weekends',
        start_time: '09:00',
        end_time: '16:00',
        date: '08',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['OUTING', 'RECREATION', 'COMMUNITY'],
        spotsLeft: 20,
        image: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=800&h=600&fit=crop',
        requirements: ['Physical fitness for walking', 'Patience and adaptability', 'Available for full-day outings'],
    },
    {
        _id: 'VOL010',
        title: 'SATELLITE',
        type: 'HUB',
        activityType: 'Hub Support',
        category: 'hub',
        engagementFrequency: 'twice_week',
        organizer: 'MINDS Satellite Hub',
        organizerLabel: 'Centre',
        description: 'Support activities at MINDS Satellite Hub. Help with daily programmes, meal times, and recreational activities in a smaller, more intimate setting.',
        fullDescription: `Be part of our Satellite Hub family!

**Daily activities:**
- Morning exercises and warm-ups
- Skills training sessions
- Meal time assistance
- Recreational activities
- Afternoon programmes

**Setting:**
- Smaller, community-based hub
- More intimate environment
- Close-knit volunteer team`,
        location: 'Satellite Hubs',
        schedule: 'Wed & Fri, 10:00 AM - 3:00 PM',
        start_time: '10:00',
        end_time: '15:00',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['SATELLITE', 'HUB', 'SUPPORT'],
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop',
        requirements: ['Twice weekly commitment', 'Basic first aid knowledge preferred', 'Patience and empathy'],
    },
];

// Mock resume check - in real app, this checks if user has filled resume
const MOCK_HAS_RESUME = true;

// Mock application status - null means not applied
// In real app, this would come from database based on user's applications
// Only shows status if user has previously applied to this event
const getApplicationStatus = (eventId: string) => {
    const mockStatuses: Record<string, 'pending' | 'approved' | 'rejected' | null> = {
        // 'VOL001': 'approved', // Uncomment to test approved state
        'VOL003': 'pending', // Example: user applied but not yet approved
    };
    return mockStatuses[eventId] || null;
};

interface VolunteerActivity {
    _id: string;
    title: string;
    type: string;
    activityType: string;
    category: string;
    engagementFrequency: string;
    organizer: string;
    organizerLabel?: string;
    description: string;
    fullDescription?: string;
    location: string;
    schedule: string;
    start_time: string;
    end_time: string;
    date: string;
    month: string;
    year: string;
    tags: string[];
    spotsLeft?: number;
    image: string;
    requirements?: string[];
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activity, setActivity] = useState<VolunteerActivity | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationNote, setApplicationNote] = useState('');
    const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

    useEffect(() => {
        // In a real app, fetch from API
        const foundActivity = VOLUNTEER_ACTIVITIES.find((a: VolunteerActivity) => a._id === params.id);
        setActivity(foundActivity || null);

        // Check application status for volunteer activities
        if (foundActivity) {
            setApplicationStatus(getApplicationStatus(foundActivity._id));
        }

        setIsLoading(false);
    }, [params.id]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'befriending': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'hub': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'skills': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'outings': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleVolunteerClick = () => {
        if (!MOCK_HAS_RESUME) {
            // Redirect to resume page if no resume
            router.push('/profile/volunteer-resume');
            return;
        }
        setShowApplicationModal(true);
    };

    const handleSubmitApplication = async () => {
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setShowApplicationModal(false);
        setApplicationStatus('pending');
    };

    const handleWithdrawApplication = async () => {
        if (!window.confirm('Are you sure you want to withdraw your application?')) {
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setApplicationStatus(null);
    };

    const handleRegister = () => {
        setIsRegistered(true);
        // In a real app, this would call an API
    };

    const getStatusDisplay = () => {
        switch (applicationStatus) {
            case 'pending':
                return {
                    icon: Clock,
                    title: 'Application Pending',
                    description: 'Your application is being reviewed by the organizer.',
                    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                    iconColor: 'text-yellow-500',
                };
            case 'approved':
                return {
                    icon: CheckCircle,
                    title: 'Application Approved!',
                    description: 'Congratulations! You have been accepted as a volunteer.',
                    color: 'bg-green-50 border-green-200 text-green-700',
                    iconColor: 'text-green-500',
                };
            case 'rejected':
                return {
                    icon: X,
                    title: 'Application Not Accepted',
                    description: 'Unfortunately, your application was not accepted this time.',
                    color: 'bg-red-50 border-red-200 text-red-700',
                    iconColor: 'text-red-500',
                };
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Activity Not Found</h1>
                <p className="text-gray-500 mb-6">The volunteer activity you&apos;re looking for doesn&apos;t exist.</p>
                <button
                    onClick={() => router.push('/events')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                    Back to Volunteer Activities
                </button>
            </div>
        );
    }

    const statusDisplay = getStatusDisplay();

    return (
        <div className="max-w-5xl mx-auto px-0 md:px-4">
            {/* Application Modal */}
            <AnimatePresence>
                {showApplicationModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowApplicationModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Apply as Volunteer</h2>
                                <button
                                    onClick={() => setShowApplicationModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Activity Summary */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    {activity.title} {activity.type}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {activity.schedule}
                                </p>
                            </div>

                            {/* Resume Info */}
                            <div className="bg-green-50 rounded-2xl p-4 mb-6 flex items-start gap-3">
                                <FileText size={20} className="text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Your Volunteer Resume</p>
                                    <p className="text-sm text-gray-600">Your skills and interests will be shared with the organizer.</p>
                                    <Link
                                        href="/profile/volunteer-resume"
                                        className="text-sm text-green-600 font-medium hover:underline"
                                    >
                                        View/Edit Resume →
                                    </Link>
                                </div>
                            </div>

                            {/* Application Note */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Why do you want to volunteer? (Optional)
                                </label>
                                <textarea
                                    value={applicationNote}
                                    onChange={(e) => setApplicationNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 focus:bg-white transition-all resize-none"
                                    placeholder="Tell the organizer why you're interested..."
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitApplication}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Application
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                The organizer will review your application and notify you via email.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 group px-4 md:px-0"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Volunteer Activities</span>
            </motion.button>

            {/* Hero Image */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-64 md:h-96 md:rounded-3xl overflow-hidden mb-6 md:mb-8"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Category Badge */}
                <div className={`absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider border ${getCategoryColor(activity.category)}`}>
                    {activity.category}
                </div>

                {/* Date Overlay */}
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 text-white">
                    <span className="block text-5xl md:text-8xl font-bold leading-none drop-shadow-lg">
                        {activity.date}
                    </span>
                    <span className="text-base md:text-lg font-medium tracking-widest opacity-90">
                        {activity.month} {activity.year}
                    </span>
                </div>

                {/* Share Button */}
                <button className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <Share2 size={20} />
                </button>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="text-green-600">{activity.title}</span>{' '}
                            <span className="text-gray-400 font-normal">{activity.type}</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            {activity.organizerLabel || 'Programme'}: <span className="font-semibold text-gray-900">{activity.organizer}</span>
                        </p>
                    </motion.div>

                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4">About This Activity</h2>
                        <div className="prose prose-gray max-w-none">
                            {(activity.fullDescription || activity.description).split('\n').map((line: string, i: number) => {
                                // Check if line is a section header (starts with **)
                                const headerMatch = line.match(/^\*\*(.+?)\*\*$/);
                                if (headerMatch) {
                                    return (
                                        <h3 key={i} className="text-base font-bold text-gray-900 mt-4 mb-2">
                                            {headerMatch[1]}
                                        </h3>
                                    );
                                }
                                // Check if line starts with a dash (list item)
                                if (line.trim().startsWith('-')) {
                                    return (
                                        <p key={i} className="text-gray-600 mb-1 pl-2 flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>{line.trim().substring(1).trim()}</span>
                                        </p>
                                    );
                                }
                                // Empty lines
                                if (line.trim() === '') {
                                    return <div key={i} className="h-2" />;
                                }
                                // Regular paragraph
                                return (
                                    <p key={i} className="text-gray-600 mb-3">
                                        {line}
                                    </p>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Requirements */}
                    {activity.requirements && activity.requirements.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-green-50 rounded-2xl p-6 border border-green-100"
                        >
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
                            <ul className="space-y-2">
                                {activity.requirements.map((req: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Tags */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap gap-2"
                    >
                        {activity.tags.map((tag: string) => (
                            <span
                                key={tag}
                                className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600"
                            >
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                </div>

                {/* Sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Activity Details Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Activity Details</h2>

                        {/* Schedule */}
                        <div className="flex items-start gap-3">
                            <Calendar size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{activity.schedule}</p>
                                <p className="text-sm text-gray-500">{activity.date} {activity.month} {activity.year}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                            <MapPin size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className={`font-medium ${activity.location === 'To Be Confirmed' ? 'italic text-gray-400' : 'text-gray-900'}`}>
                                    {activity.location}
                                </p>
                            </div>
                        </div>

                        {/* Spots Left */}
                        <div className="flex items-start gap-3">
                            <Users size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                {activity.spotsLeft !== undefined && (
                                    <p className="text-sm text-green-600 font-medium">{activity.spotsLeft} spots left</p>
                                )}
                            </div>
                        </div>

                        {/* Free Badge */}
                        <div className="pt-4 border-t border-gray-100">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                FREE TO VOLUNTEER
                            </span>
                        </div>
                    </div>

                    {/* Application Status */}
                    {statusDisplay && (
                        <div className={`rounded-2xl p-6 border text-center ${statusDisplay.color}`}>
                            <statusDisplay.icon size={48} className={`mx-auto mb-3 ${statusDisplay.iconColor}`} />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{statusDisplay.title}</h3>
                            <p className="text-sm mb-4">{statusDisplay.description}</p>

                            {/* Withdraw button for pending applications */}
                            {applicationStatus === 'pending' && (
                                <button
                                    onClick={handleWithdrawApplication}
                                    className="text-sm text-red-600 font-medium hover:text-red-700 hover:underline"
                                >
                                    Withdraw Application
                                </button>
                            )}
                        </div>
                    )}

                    {/* CTA Button */}
                    {!applicationStatus && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVolunteerClick}
                            className="w-full py-4 font-bold tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-3 bg-green-600 text-white hover:bg-green-700"
                        >
                            <Heart size={20} />
                            APPLY TO VOLUNTEER
                        </motion.button>
                    )}

                    {/* Resume Hint */}
                    {!applicationStatus && !MOCK_HAS_RESUME && (
                        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-start gap-3">
                            <AlertCircle size={20} className="text-orange-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Complete Your Resume First</p>
                                <p className="text-xs text-gray-600">Create your volunteer resume before applying.</p>
                                <Link
                                    href="/profile/volunteer-resume"
                                    className="text-sm text-orange-600 font-medium hover:underline"
                                >
                                    Create Resume →
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

