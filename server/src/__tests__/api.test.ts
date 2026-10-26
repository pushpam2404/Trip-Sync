import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

import { createApp } from '../app';

let server: Server;
let base: string;

before(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
    server.close();
});

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });

test('health check responds', async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'healthy');
});

test('signup rejects a weak password before touching the database', async () => {
    const res = await post('/api/auth/signup', { name: 'Asha Rao', phone: '9876543210', password: 'short' });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.errors.some((e: any) => e.field === 'password'));
});

test('signup rejects a phone number that is not an Indian mobile', async () => {
    const res = await post('/api/auth/signup', { name: 'Asha Rao', phone: '12345', password: 'Str0ng!pass' });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).errors.some((e: any) => e.field === 'phone'));
});

test('login rejects operator objects instead of passing them to Mongo', async () => {
    const res = await post('/api/auth/login', { phone: { $gt: '' }, password: { $gt: '' } });
    assert.equal(res.status, 400);
});

test('protected routes need a token', async () => {
    for (const path of ['/api/trips', '/api/saved-routes']) {
        assert.equal((await fetch(base + path)).status, 401, path);
    }
    assert.equal((await post('/api/sakha', { message: 'hi' })).status, 401);
});

test('unknown routes return a JSON 404', async () => {
    const res = await fetch(`${base}/api/nope`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).success, false);
});

test('CORS allows the configured origin and not others', async () => {
    const ok = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const blocked = await fetch(`${base}/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});
