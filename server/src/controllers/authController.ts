import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest, AuthUser } from '../types';
import { HttpError } from '../middleware/errorHandler';
import { signToken } from '../utils/token';
import { normalizePhone } from '../utils/phone';

const publicUser = (user: AuthUser) => ({
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    twoWheelers: user.twoWheelers,
    fourWheelers: user.fourWheelers,
});

// POST /api/auth/signup
export const registerUser = async (req: Request, res: Response) => {
    const { name, password, twoWheelers, fourWheelers } = req.body;
    const phone = normalizePhone(req.body.phone)!;

    if (await User.exists({ phone })) {
        throw new HttpError(409, 'An account with this phone number already exists');
    }

    const user = await User.create({
        name,
        phone,
        password,
        twoWheelers: twoWheelers || [],
        fourWheelers: fourWheelers || [],
    });

    res.status(201).json({ ...publicUser(user), token: signToken(user._id.toString()) });
};

// POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
    const phone = normalizePhone(req.body.phone);
    const user = phone ? await User.findOne({ phone }) : null;

    if (!user || !(await user.matchPassword(req.body.password))) {
        throw new HttpError(401, 'Invalid phone or password');
    }

    res.json({ ...publicUser(user), token: signToken(user._id.toString()) });
};

// PATCH /api/auth/profile (protected)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { name, twoWheelers, fourWheelers } = req.body;

    if (name !== undefined) user.name = name;
    if (twoWheelers !== undefined) user.twoWheelers = twoWheelers;
    if (fourWheelers !== undefined) user.fourWheelers = fourWheelers;
    await user.save();

    res.json(publicUser(user));
};
