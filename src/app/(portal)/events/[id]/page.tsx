'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Calendar, Clock, Users, Share2, Heart, CheckCircle } from 'lucide-react';

// This would normally come from an API/database
const MOCK_EVENTS = [
    {
        _id: 'VOL001',
        title: 'BEACH',
        type: 'CLEANUP',
        eventType: 'Environment',
        category: 'volunteer',
        artists: 'Green Earth Foundation',
        artistLabel: 'Organizer',
        description: 'Join us for a beach cleanup initiative! Help preserve marine life and keep our beaches beautiful. All cleaning supplies provided.',
        fullDescription: `Join us for a meaningful beach cleanup initiative at Sentosa Beach! 

**What to expect:**
- All cleaning supplies (gloves, bags, pickers) will be provided
- Light refreshments after the cleanup
- Certificate of participation for volunteers
- Group photo session

**What to bring:**
- Comfortable clothes you don't mind getting dirty
- Sunscreen and hat
- Reusable water bottle
- Positive attitude!

This is a family-friendly event. Children under 12 must be accompanied by an adult.`,
        location: 'Sentosa Beach, Singapore',
        country: 'Singapore',
        start_time: '08:00',
        end_time: '12:00',
        date: '18',
        month: 'JANUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'ENVIRONMENT', 'OUTDOOR'],
        attendees: 45,
        spotsLeft: 15,
        image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&h=600&fit=crop',
        requirements: ['Must be 12 years or older', 'Comfortable walking on sand', 'Basic English communication'],
    },
    {
        _id: 'TKY20394823',
        title: 'MUSIC',
        type: 'FESTIVAL',
        eventType: 'Music',
        category: 'conference',
        artists: 'DJ Nova, LUNA',
        description: 'An electrifying night of music featuring top DJs and live performances. Experience the best beats and immersive visuals.',
        fullDescription: `Get ready for the most electrifying music festival of the year!

**Lineup:**
- DJ Nova (Headliner)
- LUNA
- Special Guest Performers
- Local Opening Acts

**Experience:**
- State-of-the-art sound system
- Immersive LED visuals
- VIP lounge area
- Food trucks and beverages

**Ticket Tiers:**
- General Admission
- VIP Access (includes lounge access)
- Premium (front row + meet & greet)`,
        location: 'Tokyo Dome, Japan',
        country: 'Japan',
        start_time: '17:00',
        end_time: '23:00',
        date: '27',
        month: 'AUGUST',
        year: '2025',
        tags: ['MUSIC', 'DJ', 'ENTERTAINMENT'],
        attendees: 5000,
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',
        ticketPrice: '$85',
    },
    {
        _id: 'MTU002',
        title: 'TECH',
        type: 'MEETUP',
        eventType: 'Tech',
        category: 'meetup',
        artists: 'Local Developers',
        artistLabel: 'Community',
        description: 'Monthly tech meetup for developers. Share knowledge, network, and learn about the latest in web development.',
        fullDescription: `Join our monthly developer meetup!

**This Month's Topics:**
- Introduction to Next.js 16
- Building with AI APIs
- Lightning talks (5 min each)

**Schedule:**
- 7:00 PM - Networking & Snacks
- 7:30 PM - Main Presentations
- 8:30 PM - Q&A
- 9:00 PM - Open networking

Free pizza and drinks provided!`,
        location: 'WeWork Orchard, Singapore',
        country: 'Singapore',
        start_time: '19:00',
        end_time: '21:30',
        date: '22',
        month: 'JANUARY',
        year: '2026',
        tags: ['TECH', 'NETWORKING', 'DEVELOPERS'],
        attendees: 35,
        spotsLeft: 25,
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop',
    },
    {
        _id: 'VOL003',
        title: 'FOOD',
        type: 'DRIVE',
        eventType: 'Food',
        category: 'volunteer',
        artists: 'Community Kitchen',
        artistLabel: 'Organizer',
        description: 'Help distribute meals to the elderly and less privileged families in the neighborhood.',
        fullDescription: `Make a difference in your community!

**Your Role:**
- Help pack meal boxes
- Distribute meals door-to-door
- Spend time chatting with elderly residents

**What We Provide:**
- Volunteer T-shirt
- Lunch for all volunteers
- Transportation to distribution points

No experience needed - just a kind heart!`,
        location: 'Tampines Community Center, Singapore',
        country: 'Singapore',
        start_time: '10:00',
        end_time: '14:00',
        date: '25',
        month: 'JANUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'COMMUNITY', 'FOOD'],
        attendees: 20,
        spotsLeft: 10,
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop',
        requirements: ['Must be 16 years or older', 'Able to carry up to 5kg'],
    },
    {
        _id: 'SGP99482101',
        title: 'STARTUP',
        type: 'SUMMIT',
        eventType: 'Business',
        category: 'conference',
        artists: 'Industry Leaders',
        artistLabel: 'Speakers',
        description: 'Connect with investors, mentors, and fellow entrepreneurs.',
        fullDescription: `The premier startup event of Southeast Asia!

**Featured Sessions:**
- Keynote: Future of AI Startups
- Panel: Fundraising in 2026
- Workshop: Pitch Perfect
- Networking Lunch

**Speakers Include:**
- CEOs from top unicorns
- Venture capital partners
- Industry thought leaders`,
        location: 'Marina Bay Sands, Singapore',
        country: 'Singapore',
        start_time: '09:00',
        end_time: '18:00',
        date: '15',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['BUSINESS', 'STARTUP', 'INVESTMENT'],
        attendees: 450,
        image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&h=600&fit=crop',
        ticketPrice: '$150',
    },
    {
        _id: 'MTU004',
        title: 'BOOK',
        type: 'CLUB',
        eventType: 'Education',
        category: 'meetup',
        artists: 'Reading Society',
        artistLabel: 'Host',
        description: 'Monthly book club meeting. This month: "Atomic Habits". New members welcome!',
        fullDescription: `Join our cozy book club discussion!

**This Month's Book:** Atomic Habits by James Clear

**Discussion Points:**
- Key takeaways from the book
- Implementing habits in daily life
- Sharing personal experiences

Tea and snacks provided. Bring your copy of the book!`,
        location: 'To Be Confirmed',
        country: 'Singapore',
        start_time: '15:00',
        end_time: '17:00',
        date: '28',
        month: 'JANUARY',
        year: '2026',
        tags: ['BOOKS', 'SOCIAL', 'DISCUSSION'],
        attendees: 12,
        spotsLeft: 8,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
    },
    {
        _id: 'VOL005',
        title: 'TEACHING',
        type: 'WORKSHOP',
        eventType: 'Education',
        category: 'volunteer',
        artists: 'CodeForGood',
        artistLabel: 'Program',
        description: 'Teach basic coding skills to underprivileged youth.',
        fullDescription: `Share your knowledge and inspire the next generation!

**What You'll Do:**
- Teach basic HTML/CSS to students aged 12-16
- Guide hands-on coding exercises
- Mentor and encourage learning

**Requirements:**
- Basic web development knowledge
- Patience and enthusiasm
- No teaching experience needed!

Training session provided before the workshop.`,
        location: 'Community Library, Jurong East, Singapore',
        country: 'Singapore',
        start_time: '14:00',
        end_time: '17:00',
        date: '01',
        month: 'FEBRUARY',
        year: '2026',
        tags: ['VOLUNTEER', 'EDUCATION', 'CODING'],
        attendees: 8,
        spotsLeft: 4,
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop',
        requirements: ['Basic HTML/CSS knowledge', 'Good communication skills'],
    },
    {
        _id: 'NYC88723456',
        title: 'ART',
        type: 'EXHIBITION',
        eventType: 'Art',
        category: 'conference',
        artists: 'Various Artists',
        artistLabel: 'Featured',
        description: 'A curated collection of contemporary art from emerging and established artists.',
        fullDescription: `Experience contemporary art at its finest!

**Exhibition Highlights:**
- 50+ artworks from international artists
- Interactive installations
- Guided tours available
- Artist meet & greet sessions

**Special Events:**
- Opening night gala
- Artist talks every weekend
- Workshops for all ages`,
        location: 'National Gallery, Singapore',
        country: 'Singapore',
        start_time: '10:00',
        end_time: '20:00',
        date: '03',
        month: 'MARCH',
        year: '2026',
        tags: ['ART', 'CULTURE', 'EXHIBITION'],
        attendees: 890,
        image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop',
        ticketPrice: '$25',
    },
];

interface Event {
    _id: string;
    title: string;
    type: string;
    eventType: string;
    category: string;
    artists: string;
    artistLabel?: string;
    description: string;
    fullDescription?: string;
    location: string;
    country: string;
    start_time: string;
    end_time: string;
    date: string;
    month: string;
    year: string;
    tags: string[];
    attendees?: number;
    spotsLeft?: number;
    image: string;
    requirements?: string[];
    ticketPrice?: string;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, fetch from API
        const foundEvent = MOCK_EVENTS.find(e => e._id === params.id);
        setEvent(foundEvent || null);
        setIsLoading(false);
    }, [params.id]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'volunteer': return 'bg-green-100 text-green-700 border-green-200';
            case 'meetup': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'conference': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleRegister = () => {
        setIsRegistered(true);
        // In a real app, this would call an API
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
                <p className="text-gray-500 mb-6">The event you're looking for doesn't exist.</p>
                <button
                    onClick={() => router.push('/events')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.push('/events')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Events</span>
            </motion.button>

            {/* Hero Image */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-64 md:h-96 rounded-3xl overflow-hidden mb-8"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Category Badge */}
                <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border ${getCategoryColor(event.category)}`}>
                    {event.category}
                </div>

                {/* Date Overlay */}
                <div className="absolute bottom-6 left-6 text-white">
                    <span className="block text-6xl md:text-8xl font-bold leading-none drop-shadow-lg">
                        {event.date}
                    </span>
                    <span className="text-lg font-medium tracking-widest opacity-90">
                        {event.month} {event.year}
                    </span>
                </div>

                {/* Share Button */}
                <button className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <Share2 size={20} />
                </button>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="text-blue-600">{event.title}</span>{' '}
                            <span className="text-gray-400 font-normal">{event.type}</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            {event.artistLabel || 'Organizer'}: <span className="font-semibold text-gray-900">{event.artists}</span>
                        </p>
                    </motion.div>

                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-4">About This Event</h2>
                        <div className="prose prose-gray max-w-none">
                            {(event.fullDescription || event.description).split('\n').map((paragraph, i) => (
                                <p key={i} className="text-gray-600 mb-3 whitespace-pre-wrap">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </motion.div>

                    {/* Requirements (for volunteer events) */}
                    {event.requirements && event.requirements.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-green-50 rounded-2xl p-6 border border-green-100"
                        >
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
                            <ul className="space-y-2">
                                {event.requirements.map((req, i) => (
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
                        {event.tags.map(tag => (
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
                    {/* Event Details Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Event Details</h2>

                        {/* Date & Time */}
                        <div className="flex items-start gap-3">
                            <Calendar size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{event.date} {event.month} {event.year}</p>
                                <p className="text-sm text-gray-500">{event.start_time} - {event.end_time}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                            <MapPin size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className={`font-medium ${event.location === 'To Be Confirmed' ? 'italic text-gray-400' : 'text-gray-900'}`}>
                                    {event.location}
                                </p>
                            </div>
                        </div>

                        {/* Attendees */}
                        <div className="flex items-start gap-3">
                            <Users size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">{event.attendees} attending</p>
                                {event.spotsLeft !== undefined && (
                                    <p className="text-sm text-orange-500 font-medium">{event.spotsLeft} spots left</p>
                                )}
                            </div>
                        </div>

                        {/* Price */}
                        {event.ticketPrice && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500">Starting from</p>
                                <p className="text-3xl font-bold text-gray-900">{event.ticketPrice}</p>
                            </div>
                        )}

                        {/* Free Badge for volunteer */}
                        {event.category === 'volunteer' && (
                            <div className="pt-4 border-t border-gray-100">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                    FREE TO VOLUNTEER
                                </span>
                            </div>
                        )}
                    </div>

                    {/* CTA Button */}
                    {isRegistered ? (
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
                            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">You're Registered!</h3>
                            <p className="text-sm text-gray-600">Check your email for confirmation details.</p>
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRegister}
                            className={`w-full py-4 font-bold tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-3 ${event.category === 'volunteer'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            {event.category === 'volunteer' ? (
                                <>
                                    <Heart size={20} />
                                    VOLUNTEER NOW
                                </>
                            ) : event.category === 'meetup' ? (
                                'RSVP NOW'
                            ) : (
                                'GET TICKETS'
                            )}
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
