import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role: 'user' | 'volunteer' | 'staff';
    tier?: 'ad-hoc' | 'weekly';
    skills?: string[];
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: {
        type: String,
        enum: ['user', 'volunteer', 'staff'],
        default: 'user',
        required: true
    },
    tier: {
        type: String,
        enum: ['ad-hoc', 'weekly']
    },
    skills: { type: [String] },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
