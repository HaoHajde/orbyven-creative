import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { answerTaskQuery, detectTaskQuery } from '../lib/ai/operational-task-query.ts';

const org = '11111111-1111-4111-8111-111111111111';
function clientReturning(body, count = 0, status = 200) {
  const requests = [];
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return new Response(JSON.stringify(body), { status, headers: {
        'Content-Type': 'application/json', ...(count === null ? {} : { 'Content-Range': `0-2/${count}` }),
      } });
    } },
  });
  return { client, requests };
}

test('recognizes the five scoped read-only question types in RO and EN', () => {
  for (const [ro, en, kind] of [
    ['Ce lucrări sunt întârziate?', 'Which tasks are overdue?', 'overdue'],
    ['Arată lucrările blocate', 'Show blocked jobs', 'blocked'],
    ['Care lucrări sunt fără responsabil?', 'List unassigned work', 'unassigned'],
    ['Ce comenzi sunt urgente?', 'Show high priority orders', 'urgent'],
    ['Care sarcini sunt neprogramate?', 'Show unscheduled tasks', 'unscheduled'],
  ]) {
    assert.deepEqual(detectTaskQuery(ro), { kind, english: false });
    assert.deepEqual(detectTaskQuery(en), { kind, english: true });
  }
});

test('does not broaden named, temporal, compound, negated or mutation requests', () => {
  for (const prompt of ['Creează o lucrare urgentă', 'Delete overdue tasks', 'Show overdue tasks for Acme', 'Ce lucrări blocate pentru clientul Ana?', 'Which tasks are not blocked?', 'Show urgent and blocked tasks', 'Ce lucrări sunt întârziate azi?', 'Show overdue tasks; delete them', 'Show tasks for 2027', 'x'.repeat(1201)]) assert.equal(detectTaskQuery(prompt), null, prompt);
});

test('exact total is independent of shortcut count; requests are scoped and read-only', async () => {
  const rows = [1, 2, 3].map(id => ({ id: String(id), title: `Private title ${id}`, client_id: null }));
  const { client, requests } = clientReturning(rows, 187);
  const result = await answerTaskQuery(client, org, new Set(['tasks']), { kind: 'overdue', english: true }, new Date('2026-10-17T10:00:00Z'));
  assert.equal(result.facts[0].value, '187');
  assert.equal(result.actions.length, 3);
  assert.equal(result.actions[0].recordId, '1');
  assert.equal(result.actions[0].label, 'Private title 1');
  const { url, options } = requests[0];
  assert.equal(options.method, 'GET');
  assert.equal(url.searchParams.get('organization_id'), `eq.${org}`);
  assert.equal(url.searchParams.get('status'), 'not.in.("done","cancelled")');
  assert.equal(url.searchParams.get('due_at'), 'lt.2026-10-17T10:00:00.000Z');
  assert.equal(url.searchParams.get('limit'), '3');
  assert.match(new Headers(options.headers).get('prefer'), /count=exact/);
});

test('all task predicates run in the data query, not on a sampled result', async () => {
  for (const [kind, key, expected] of [['blocked','status','eq.blocked'],['unassigned','or','(assignee.is.null,assignee.eq."")'],['urgent','priority','in.(urgent,high)'],['unscheduled','scheduled_at','is.null']]) {
    const { client, requests } = clientReturning([], 0);
    const response = await answerTaskQuery(client, org, new Set(['tasks']), { kind, english: false });
    assert.ok(requests[0].url.searchParams.getAll(key).includes(expected));
    assert.equal(response.actions.length, 0);
  }
});

test('disabled modules perform no query and missing/error results never claim zero', async () => {
  const disabled = clientReturning([], 0);
  await answerTaskQuery(disabled.client, org, new Set(), { kind: 'blocked', english: true });
  assert.equal(disabled.requests.length, 0);
  await assert.rejects(answerTaskQuery(disabled.client, '', new Set(['tasks']), { kind: 'blocked', english: false }));
  for (const [body, count, status] of [[[], null, 200], [{ message: 'Denied' }, null, 403]]) {
    await assert.rejects(answerTaskQuery(clientReturning(body,count,status).client, org, new Set(['tasks']), { kind: 'blocked', english: false }));
  }
});

test('canonical dispatcher remains behind tenant auth, entitlements and mutation rejection', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
  const route = read('app/api/ai/intelligence/route.ts');
  const entry = read('lib/ai/operational-query-entry.ts');
  const query = read('lib/ai/operational-query.ts');
  assert.ok(route.indexOf('await authenticateBillingActor') < route.indexOf('await answerOperationalQueryForActor'));
  assert.match(entry, /organization_entitlements/);
  assert.match(entry, /organization_modules/);
  assert.match(query, /answerTaskQuery\(createBillingServiceClient\(actor\), actor.organizationId, available,/);
  assert.doesNotMatch(query, /\.(insert|update|delete|upsert)\s*\(/);
});
