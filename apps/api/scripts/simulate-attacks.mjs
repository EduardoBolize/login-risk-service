#!/usr/bin/env node
// Replays realistic login scenarios against a running API and checks each decision.
// Doubles as an end-to-end smoke test: exits with code 1 if any decision is unexpected.
//
//   API_URL=http://localhost:3000 API_KEY=dev-api-key node scripts/simulate-attacks.mjs

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const API_KEY = process.env.API_KEY ?? 'dev-api-key';

// Unique ids and randomized IPs keep repeated runs from polluting each other's Redis state.
const run = Date.now().toString(36);
const octet = () => 1 + Math.floor(Math.random() * 254);
const BRAZIL_IP = `177.71.0.${octet()}`;
const LISBON_IP = `193.136.0.${octet()}`;
const US_IP = `8.8.${octet()}.${octet()}`;
const BOTNET_IP = `81.2.69.${octet()}`;

const now = Date.now();
const minutesAgo = (minutes) => new Date(now - minutes * 60_000).toISOString();

const alice = `alice-${run}`;
const bob = `bob-${run}`;

const scenarios = [
  {
    title: 'Usuário legítimo: primeiro login no laptop (Brasil)',
    events: [{ userId: alice, ip: BRAZIL_IP, deviceId: 'alice-laptop', success: true, timestamp: minutesAgo(180) }],
    expect: { decision: 'ALLOW', reasons: [] },
  },
  {
    title: 'Usuário legítimo: volta no mesmo laptop',
    events: [{ userId: alice, ip: BRAZIL_IP, deviceId: 'alice-laptop', success: true, timestamp: minutesAgo(120) }],
    expect: { decision: 'ALLOW', reasons: [] },
  },
  {
    title: 'Device novo: Alice entra pelo celular',
    events: [{ userId: alice, ip: BRAZIL_IP, deviceId: 'alice-phone', success: true, timestamp: minutesAgo(60) }],
    expect: { decision: 'CHALLENGE', reasons: ['NEW_DEVICE'] },
  },
  {
    title: 'Conta comprometida: Lisboa 30 min depois, device desconhecido',
    events: [{ userId: alice, ip: LISBON_IP, deviceId: 'unknown-pc', success: true, timestamp: minutesAgo(30) }],
    expect: { decision: 'DENY', reasons: ['NEW_DEVICE', 'IMPOSSIBLE_TRAVEL'] },
  },
  {
    title: 'Brute force: 5 senhas erradas e então a correta',
    events: [
      ...[10, 9, 8, 7, 6].map((m) => ({ userId: bob, ip: US_IP, deviceId: 'bob-pc', success: false, timestamp: minutesAgo(m) })),
      { userId: bob, ip: US_IP, deviceId: 'bob-pc', success: true, timestamp: minutesAgo(5) },
    ],
    expect: { decision: 'CHALLENGE', reasons: ['BRUTE_FORCE'] },
  },
  {
    title: 'Credential stuffing: um IP testando 6 contas',
    events: [1, 2, 3, 4, 5, 6].map((i) => ({
      userId: `victim-${i}-${run}`,
      ip: BOTNET_IP,
      deviceId: 'headless-bot',
      userAgent: 'python-requests/2.32',
      success: false,
    })),
    expect: { decision: 'CHALLENGE', reasons: ['CREDENTIAL_STUFFING'] },
  },
];

async function evaluate(event) {
  const response = await fetch(`${API_URL}/v1/risk/evaluate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

const sameReasons = (a, b) => a.length === b.length && a.every((reason) => b.includes(reason));

let failures = 0;
console.log(`Simulating against ${API_URL}\n`);

for (const scenario of scenarios) {
  let result;
  for (const event of scenario.events) {
    result = await evaluate(event);
  }

  const ok =
    result.decision === scenario.expect.decision && sameReasons(result.reasons, scenario.expect.reasons);
  if (!ok) failures++;

  const reasons = result.reasons.length ? result.reasons.join(', ') : '—';
  console.log(`${ok ? '✔' : '✘'} ${scenario.title}`);
  console.log(`    ${result.decision.padEnd(9)} score ${String(result.score).padStart(3)}  ${reasons}`);
  if (!ok) {
    console.log(`    expected ${scenario.expect.decision} [${scenario.expect.reasons.join(', ')}]`);
  }
}

console.log(`\n${scenarios.length - failures}/${scenarios.length} scenarios behaved as expected`);
process.exit(failures ? 1 : 0);
