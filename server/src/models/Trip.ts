import mongoose from 'mongoose';

export const TRAVEL_MODES = ['4W', '2W', 'train', 'walking'] as const;

const tripSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        startDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        vehicle: { type: String },
        travelers: { type: Number, default: 1 },
        stops: [
            {
                location: { lat: Number, lng: Number },
                name: String,
                stopover: { type: Boolean, default: true },
            },
        ],
        duration: { type: String },
        mode: { type: String, enum: TRAVEL_MODES, default: '4W' },
    },
    { timestamps: true },
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
