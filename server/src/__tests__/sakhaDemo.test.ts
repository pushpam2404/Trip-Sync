import test from 'node:test';
import assert from 'node:assert/strict';
import { demoReply, extractRoute } from '../utils/sakhaDemo';

test('extractRoute understands the common phrasings', () => {
    const cases: [string, string, string][] = [
        ['take me from pune to mahabaleshwar', 'Pune', 'Mahabaleshwar'],
        ['Navigate from Mumbai to Lonavala please', 'Mumbai', 'Lonavala'],
        ['Delhi to Jaipur', 'Delhi', 'Jaipur'],
        ['plan a trip from Bengaluru to Coorg this weekend', 'Bengaluru', 'Coorg'],
        ['route Pune -> Goa', 'Pune', 'Goa'],
    ];
    for (const [input, origin, destination] of cases) {
        assert.deepEqual(extractRoute(input), { origin, destination }, input);
    }
});

test('extractRoute ignores messages without two places', () => {
    assert.equal(extractRoute('where can I get petrol'), null);
    assert.equal(extractRoute('hello'), null);
});

test('a route request returns a navigation card', () => {
    const reply = demoReply('take me from Pune to Goa');
    assert.deepEqual(reply.navigationIntent, { origin: 'Pune', destination: 'Goa' });
    assert.match(reply.text, /demo mode/i);
});

test('topic questions return advice and no card', () => {
    for (const [question, word] of [
        ['petrol pumps near Wai', /petrol/i],
        ['good dhaba for chai on the way?', /food|dhabas/i],
        ['any atm nearby', /ATM/],
        ['EV charging stations near Pune', /charg/i],
        ['what is the weather like in Manali', /weather|forecast/i],
    ] as [string, RegExp][]) {
        const reply = demoReply(question);
        assert.equal(reply.navigationIntent, null, question);
        assert.match(reply.text, word, question);
    }
});

test('a destination without an origin asks for the starting point', () => {
    const reply = demoReply('take me to Goa');
    assert.equal(reply.navigationIntent, null);
    assert.match(reply.text, /starting from/i);
});

test('greetings and unknown input explain what demo mode understands', () => {
    assert.match(demoReply('Namaste').text, /demo/i);
    assert.match(demoReply('asdf qwer').text, /demo mode/i);
});

test('replies are deterministic', () => {
    assert.deepEqual(demoReply('Delhi to Agra'), demoReply('Delhi to Agra'));
});
