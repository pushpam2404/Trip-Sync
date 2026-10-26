import { Response } from 'express';
import SavedRoute from '../models/SavedRoute';
import { AuthRequest } from '../types';
import { HttpError } from '../middleware/errorHandler';

// POST /api/saved-routes
export const saveRoute = async (req: AuthRequest, res: Response) => {
    const { origin, destination, stay } = req.body;
    const route = await SavedRoute.create({ userId: req.user!._id, origin, destination, stay });
    res.status(201).json(route);
};

// GET /api/saved-routes
export const getSavedRoutes = async (req: AuthRequest, res: Response) => {
    const routes = await SavedRoute.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(routes);
};

// DELETE /api/saved-routes/:id
export const deleteSavedRoute = async (req: AuthRequest, res: Response) => {
    const route = await SavedRoute.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!route) throw new HttpError(404, 'Route not found');
    res.json({ message: 'Route removed' });
};
