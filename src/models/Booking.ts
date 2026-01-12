import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    user_id: mongoose.Types.ObjectId;
    activity_id: mongoose.Types.ObjectId;
    status: 'confirmed' | 'attended' | 'cancelled';
    timestamp: Date;
}

const BookingSchema: Schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activity_id: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    status: {
        type: String,
        enum: ['confirmed', 'attended', 'cancelled'],
        default: 'confirmed'
    },
    timestamp: { type: Date, default: Date.now },
});

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
