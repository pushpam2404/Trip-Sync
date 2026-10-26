import test from 'node:test';
import assert from 'node:assert/strict';
import type { Response } from 'express';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';

import User from '../models/User';
import { protect } from '../middleware/authMiddleware';
import { signToken, verifyToken } from '../utils/token';
import jwt from 'jsonwebtoken';

const fakeRes = () => {
    const res = { statusCode: 200, body: undefined as any, sent: 0 } as any;
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (body: unknown) => { res.body = body; res.sent += 1; return res; };
    return res as Response & { statusCode: number; body: any; sent: number };
};

const run = async (authorization?: string) => {
    const res = fakeRes();
    let nextCalled = false;
    const req: any = { headers: authorization ? { authorization } : {} };
    await protect(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
};

test('tokens round trip and reject tampering', () => {
    const token = signToken('abc123');
    assert.equal(verifyToken(token), 'abc123');
    assert.equal(verifyToken(token + 'x'), null);
    assert.equal(verifyToken(jwt.sign({ id: 'abc123' }, 'another-secret')), null);
    assert.equal(verifyToken(jwt.sign({ id: 'abc123' }, process.env.JWT_SECRET!, { expiresIn: -10 })), null);
});

test('protect answers 401 exactly once when there is no usable token', async () => {
    for (const header of [undefined, 'Bearer', 'Bearer ', 'Basic abc', 'Bearer not.a.jwt']) {
        const { res, nextCalled } = await run(header);
        assert.equal(res.statusCode, 401, `header: ${header}`);
        assert.equal(res.sent, 1, `header: ${header}`);
        assert.equal(nextCalled, false);
    }
});

test('protect rejects a valid token whose user was deleted', async () => {
    const original = User.findById;
    (User as any).findById = () => ({ select: async () => null });
    try {
        const { res, nextCalled } = await run(`Bearer ${signToken('64b7f0f2a1b2c3d4e5f60718')}`);
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    } finally {
        (User as any).findById = original;
    }
});

test('protect attaches the user and calls next for a valid token', async () => {
    const original = User.findById;
    const user = { _id: 'u1', name: 'Test' };
    (User as any).findById = () => ({ select: async () => user });
    try {
        const { req, res, nextCalled } = await run(`Bearer ${signToken('64b7f0f2a1b2c3d4e5f60718')}`);
        assert.equal(nextCalled, true);
        assert.equal(req.user, user);
        assert.equal(res.sent, 0);
    } finally {
        (User as any).findById = original;
    }
});
