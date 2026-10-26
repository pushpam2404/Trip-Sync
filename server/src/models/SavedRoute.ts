import mongoose from 'mongoose';

const savedRouteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    stay: { type: String }, // the stay this hop starts from
}, {
    timestamps: true,
});

const SavedRoute = mongoose.model('SavedRoute', savedRouteSchema);

export default SavedRoute;
