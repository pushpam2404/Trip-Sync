import { Request } from 'express';
import { HydratedDocument } from 'mongoose';
import type { IUser, UserMethods } from '../models/User';

export type AuthUser = HydratedDocument<IUser, UserMethods>;

/** Express request after the `protect` middleware has attached the user. */
export interface AuthRequest extends Request {
    user?: AuthUser;
}
