import jwt from 'jsonwebtoken';

const getSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }
    return secret;
};

export const signToken = (id: string): string =>
    jwt.sign({ id }, getSecret(), { algorithm: 'HS256', expiresIn: '30d' });

/** Returns the user id stored in the token, or null if it is invalid or expired. */
export const verifyToken = (token: string): string | null => {
    try {
        const payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
        if (typeof payload === 'object' && typeof payload.id === 'string') {
            return payload.id;
        }
        return null;
    } catch {
        return null;
    }
};
