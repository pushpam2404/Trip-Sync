// Fills the database with three demo travellers, their vehicles, trips and saved
// routes, so every screen has something to show. Safe to run more than once:
// the demo users are matched by phone number and their trips are rebuilt.
//
//   MONGO_URI=... npm run seed:demo
//
// Refuses to run when NODE_ENV=production unless ALLOW_DEMO_SEED=1 is set.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Trip from '../models/Trip';
import SavedRoute from '../models/SavedRoute';

dotenv.config();

export const DEMO_PASSWORD = 'Demo@1234';

const day = (offset: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + offset);
    return d;
};

const stop = (name: string, lat: number, lng: number) => ({ name, location: { lat, lng }, stopover: true });

const DEMO_USERS = [
    {
        name: 'Aarav Mehta',
        phone: '+91 9000000001',
        twoWheelers: [{ id: 'v1', regNumber: 'MH12 AB 1234' }],
        fourWheelers: [{ id: 'v2', regNumber: 'MH14 XY 4321' }],
        trips: [
            { origin: 'Pune', destination: 'Goa', offset: -21, time: '05:30', vehicle: 'MH14 XY 4321', travelers: 3, duration: '9h 40m', mode: '4W',
              stops: [stop('Kolhapur', 16.705, 74.2433), stop('Belagavi', 15.8497, 74.4977)] },
            { origin: 'Mumbai', destination: 'Nashik', offset: -9, time: '07:15', vehicle: 'MH14 XY 4321', travelers: 2, duration: '4h 10m', mode: '4W',
              stops: [stop('Igatpuri', 19.6967, 73.5627)] },
            { origin: 'Pune', destination: 'Mahabaleshwar', offset: 6, time: '06:00', vehicle: 'MH12 AB 1234', travelers: 1, duration: '3h 20m', mode: '2W',
              stops: [stop('Wai', 17.9519, 73.8908)] },
        ],
        saved: [
            { origin: 'Pune', destination: 'Goa', stay: 'Kolhapur' },
            { origin: 'Mumbai', destination: 'Nashik' },
        ],
    },
    {
        name: 'Diya Rao',
        phone: '+91 9000000002',
        twoWheelers: [{ id: 'v1', regNumber: 'KA05 MN 7788' }],
        fourWheelers: [],
        trips: [
            { origin: 'Bengaluru', destination: 'Coorg', offset: -30, time: '06:30', vehicle: 'KA05 MN 7788', travelers: 1, duration: '5h 45m', mode: '2W',
              stops: [stop('Mysuru', 12.2958, 76.6394), stop('Kushalnagar', 12.4592, 75.9611)] },
            { origin: 'Bengaluru', destination: 'Mysuru', offset: -12, time: '08:00', vehicle: 'KA05 MN 7788', travelers: 1, duration: '3h 10m', mode: '2W', stops: [] },
            { origin: 'Chennai', destination: 'Puducherry', offset: 12, time: '05:45', vehicle: 'KA05 MN 7788', travelers: 1, duration: '3h 30m', mode: '2W',
              stops: [stop('Mahabalipuram', 12.6208, 80.1923)] },
        ],
        saved: [{ origin: 'Bengaluru', destination: 'Coorg', stay: 'Mysuru' }],
    },
    {
        name: 'Kabir Singh',
        phone: '+91 9000000003',
        twoWheelers: [],
        fourWheelers: [{ id: 'v1', regNumber: 'DL3C AB 9090' }],
        trips: [
            { origin: 'Delhi', destination: 'Jaipur', offset: -40, time: '06:00', vehicle: 'DL3C AB 9090', travelers: 4, duration: '5h 15m', mode: '4W',
              stops: [stop('Neemrana', 27.9886, 76.3856)] },
            { origin: 'Jaipur', destination: 'Udaipur', offset: -38, time: '09:30', vehicle: 'DL3C AB 9090', travelers: 4, duration: '6h 30m', mode: '4W',
              stops: [stop('Ajmer', 26.4499, 74.6399), stop('Chittorgarh', 24.8887, 74.6269)] },
            { origin: 'Delhi', destination: 'Agra', offset: 3, time: '07:10', travelers: 2, duration: '2h 45m', mode: 'train', stops: [] },
        ],
        saved: [
            { origin: 'Delhi', destination: 'Jaipur', stay: 'Neemrana' },
            { origin: 'Jaipur', destination: 'Udaipur', stay: 'Ajmer' },
            { origin: 'Delhi', destination: 'Agra' },
        ],
    },
];

const run = async () => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
        console.error('Refusing to seed with NODE_ENV=production. Set ALLOW_DEMO_SEED=1 to override.');
        process.exit(1);
    }
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not set.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

    for (const demo of DEMO_USERS) {
        let user = await User.findOne({ phone: demo.phone });
        if (!user) user = new User({ phone: demo.phone, password: DEMO_PASSWORD });
        user.name = demo.name;
        user.password = DEMO_PASSWORD; // hashed by the model on save
        user.twoWheelers = demo.twoWheelers;
        user.fourWheelers = demo.fourWheelers;
        await user.save();

        await Trip.deleteMany({ userId: user._id });
        await SavedRoute.deleteMany({ userId: user._id });
        await Trip.insertMany(
            demo.trips.map((t) => ({
                userId: user._id,
                origin: t.origin,
                destination: t.destination,
                startDate: day(t.offset),
                startTime: t.time,
                vehicle: (t as { vehicle?: string }).vehicle,
                travelers: t.travelers,
                duration: t.duration,
                mode: t.mode,
                stops: t.stops,
            })),
        );
        await SavedRoute.insertMany(demo.saved.map((s) => ({ userId: user._id, ...s })));
        console.log(`${demo.name} (${demo.phone}): ${demo.trips.length} trips, ${demo.saved.length} saved routes`);
    }

    await mongoose.disconnect();
};

run().catch((error) => {
    console.error('Seeding failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
