import { Response } from 'express';
import Trip from '../models/Trip';
import { AuthRequest } from '../types';
import { HttpError } from '../middleware/errorHandler';

const pickTripFields = (body: any) => {
    const { origin, destination, startDate, startTime, vehicle, stops, travelers, duration, mode } = body;
    return { origin, destination, startDate, startTime, vehicle, stops, travelers, duration, mode };
};

// POST /api/trips
export const createTrip = async (req: AuthRequest, res: Response) => {
    const trip = await Trip.create({ ...pickTripFields(req.body), userId: req.user!._id });
    res.status(201).json(trip);
};

// GET /api/trips
export const getTrips = async (req: AuthRequest, res: Response) => {
    const trips = await Trip.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(trips);
};

// PUT /api/trips/:id
export const updateTrip = async (req: AuthRequest, res: Response) => {
    const trip = await Trip.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!._id },
        pickTripFields(req.body),
        { new: true, runValidators: true },
    );
    if (!trip) throw new HttpError(404, 'Trip not found');
    res.json(trip);
};

// DELETE /api/trips/:id
export const deleteTrip = async (req: AuthRequest, res: Response) => {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!trip) throw new HttpError(404, 'Trip not found');
    res.json({ message: 'Trip removed' });
};

// DELETE /api/trips
export const clearTrips = async (req: AuthRequest, res: Response) => {
    const result = await Trip.deleteMany({ userId: req.user!._id });
    res.json({ message: 'Trips removed', deleted: result.deletedCount });
};
