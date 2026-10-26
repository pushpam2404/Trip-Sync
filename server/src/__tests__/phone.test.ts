import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../utils/phone';

test('normalizePhone accepts the formats the client and curl users send', () => {
    assert.equal(normalizePhone('9876543210'), '+91 9876543210');
    assert.equal(normalizePhone('+91 9876543210'), '+91 9876543210');
    assert.equal(normalizePhone('+919876543210'), '+91 9876543210');
    assert.equal(normalizePhone('91 98765-43210'), '+91 9876543210');
});

test('normalizePhone rejects anything that is not a 10 digit mobile number', () => {
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('+1 9876543210'), null);
    assert.equal(normalizePhone(undefined), null);
    assert.equal(normalizePhone({ $gt: '' }), null);
});
