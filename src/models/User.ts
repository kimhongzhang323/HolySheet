import mongoose, { Schema, Document, Model } from 'mongoose';



const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: {
        type: String,
        enum: ['user', 'volunteer', 'staff', 'admin'],
        default: 'user',
        required: true
    },
    tier: {
        type: String,
        enum: ['ad-hoc', 'once-a-week', 'twice-a-week', 'three-plus-a-week'],
        default: 'ad-hoc'
    },
    skills: { type: [String] },
    interests: { type: [String], default: [] }, // User selected interests
    hours_volunteered: { type: Number, default: 0 },
    missions_completed: { type: Number, default: 0 },
    bio: { type: String },
    availability: { type: [String], default: [] },
    achievements: [{
        title: { type: String },
        date: { type: Date },
        icon: { type: String }
    }],
    password: { type: String, select: false }, // Password for Credentials auth
    phoneNumber: { type: String },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    address: {
        street: { type: String },
        unit: { type: String },
        postalCode: { type: String },
        city: { type: String },
        country: { type: String },
    },
    profileDeadline: { type: Date }, // Grace period deadline
    // NextAuth fields
    emailVerified: { type: Date, default: null },
    accounts: [{ type: Schema.Types.ObjectId, ref: 'Account' }],  // Optional if we want to track via Mongoose
    sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],  // Optional
});

// Update Interface
export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role: 'user' | 'volunteer' | 'staff' | 'admin';
    tier?: 'ad-hoc' | 'once-a-week' | 'twice-a-week' | 'three-plus-a-week';
    skills?: string[];
    interests?: string[];
    hours_volunteered?: number;
    missions_completed?: number;
    bio?: string;
    availability?: string[];
    achievements?: { title: string; date: Date; icon?: string }[];
    password?: string;
    phoneNumber?: string;
    otp?: string;
    otpExpires?: Date;
    isVerified?: boolean;
    address?: {
        street?: string;
        unit?: string;
        postalCode?: string;
        city?: string;
        country?: string;
    };
    profileDeadline?: Date;
    emailVerified?: Date;
}

// Allow other properties for NextAuth flexibility if needed, or stick to strict.
// The Adapter writes directly to DB, bypassing Mongoose validation for those writes usually.
// But reading via Mongoose might miss them if not defined.
// Let's keep it simple.

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
