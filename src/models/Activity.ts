import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
    title: string;
    description: string;
    start_time: Date;
    end_time: Date;
    location: string;
    capacity: number;
    volunteers_needed: number;
    needs_help: boolean;
    metadata?: Map<string, string>;
    allowed_tiers?: ('ad-hoc' | 'once-a-week' | 'twice-a-week' | 'three-plus-a-week')[];
}

const ActivitySchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    volunteers_needed: { type: Number, default: 0 },
    needs_help: { type: Boolean, default: false },
    metadata: { type: Map, of: String },
    allowed_tiers: [{
        type: String,
        enum: ['ad-hoc', 'once-a-week', 'twice-a-week', 'three-plus-a-week']
    }],
});

const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
