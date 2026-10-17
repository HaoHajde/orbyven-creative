import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { detectAgendaQuery, agendaRange, answerAgendaQuery } from '../lib/ai/operational-agenda-query.ts';
const org = '11111111-1111-4111-8111-111111111111';
function fixture(overrides = {}) {
  const requests = [];
  const tables = { organization_profiles: { body: { timezone: 'America/New_York' } }, ops_tasks: { body: [], count: 0 }, calendar_events: { body: [], count: 0 }, ...overrides };
  const client = createClient('https://example.supabase.co', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input, options) => {
    const url = new URL(input); requests.push({ url, options });
    const { body, count, status = 200 } = tables[url.pathname.split('/').at(-1)];
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...(count === undefined ? {} : { 'Content-Range': `0-2/${count}` }) } });
  } } });
  return { client, requests };
}
const intent = { period: 'today', english: true };
const now = new Date('2026-10-17T01:00:00Z');
test('recognizes complete RO/EN agenda questions without broadening filtered requests', () => {
  for (const [ro, en, period] of [['Ce am azi?', 'What do I have today?', 'today'], ['Arată-mi agenda mâine', 'Show my agenda for tomorrow', 'tomorrow'], ['Agenda pe următoarele 7 zile', 'Agenda for the next seven days', 'seven_days']]) {
    assert.deepEqual(detectAgendaQuery(ro), { period, english: false });
    assert.deepEqual(detectAgendaQuery(en), { period, english: true });
  }
  for (const prompt of ['Ce am azi pentru Ana?', 'Show my agenda today and delete it', 'Show my agenda next week', 'Show my agenda today except meetings', 'Ce lucrări urgente am azi?', 'Creează o programare mâine', 'Agenda azi și mâine', 'What invoices do I have today?']) assert.equal(detectAgendaQuery(prompt), null, prompt);
});
test('ranges use local dates, year rollovers and real 23/25 hour DST days', () => {
  assert.deepEqual(agendaRange(now, 'America/New_York', 'today'), { start: '2026-10-16T04:00:00.000Z', end: '2026-10-17T04:00:00.000Z' });
  assert.deepEqual(agendaRange(new Date('2026-12-31T12:00:00Z'), 'Asia/Kathmandu', 'tomorrow'), { start: '2026-12-31T18:15:00.000Z', end: '2027-01-01T18:15:00.000Z' });
  for (const [date, hours] of [['2026-03-29',23], ['2026-10-25',25]]) {
    const range = agendaRange(new Date(`${date}T12:00:00Z`), 'Europe/Bucharest', 'today');
    assert.equal((Date.parse(range.end)-Date.parse(range.start))/3600000, hours);
  }
  const week = agendaRange(new Date('2026-03-27T12:00:00Z'), 'Europe/Bucharest', 'seven_days');
  assert.equal((Date.parse(week.end)-Date.parse(week.start))/3600000, 167);
  const midnight = agendaRange(new Date('2026-03-08T12:00:00Z'), 'America/Havana', 'today');
  assert.equal(midnight.start, '2026-03-08T05:00:00.000Z');
  assert.throws(() => agendaRange(now, 'invalid-zone', 'today'));
});
test('exact independent counts, globally ordered three shortcuts, tenant and date filters', async () => {
  const { client, requests } = fixture({
    ops_tasks: { count: 250, body: [8,10,12].map(hour => ({ id: `task-${hour}`, title: 'Lucrare', scheduled_at: `2026-10-16T${String(hour).padStart(2,'0')}:00:00Z`, client_id: 'client-1' })) },
    calendar_events: { count: 180, body: [3,9,11].map(hour => ({ id: `event-${hour}`, title: 'Eveniment', start_at: `2026-10-16T${String(hour).padStart(2,'0')}:00:00Z`, task_id: 'linked-task' })) },
  });
  const response = await answerAgendaQuery(client, org, new Set(['tasks','calendar']), intent, now);
  assert.deepEqual(response.facts.map(f => f.value), ['250','180']);
  assert.deepEqual(response.actions.map(a => a.recordId), ['event-3','task-8','event-9']);
  assert.equal(response.actions[0].taskId, 'linked-task');
  assert.equal(response.actions[1].clientId, 'client-1');
  assert.match(response.answer, /America\/New_York/);
  for (const { url, options } of requests) {
    assert.equal(options.method, 'GET');
    assert.equal(url.searchParams.get('organization_id'), `eq.${org}`);
    if (url.pathname.endsWith('organization_profiles')) continue;
    assert.match(new Headers(options.headers).get('prefer'), /count=exact/);
    assert.equal(url.searchParams.get('limit'), '3');
    if (url.pathname.endsWith('ops_tasks')) {
      assert.equal(url.searchParams.get('status'), 'not.in.("done","cancelled")');
      assert.deepEqual(url.searchParams.getAll('scheduled_at'), ['gte.2026-10-16T04:00:00.000Z','lt.2026-10-17T04:00:00.000Z']);
    } else {
      assert.equal(url.searchParams.get('status'), 'neq.cancelled');
      assert.equal(url.searchParams.get('start_at'), 'lt.2026-10-17T04:00:00.000Z');
      assert.equal(url.searchParams.get('or'), '(end_at.gt.2026-10-16T04:00:00.000Z,and(end_at.is.null,start_at.gte.2026-10-16T04:00:00.000Z),and(end_at.eq.2026-10-16T04:00:00.000Z,start_at.eq.2026-10-16T04:00:00.000Z))');
    }
  }
});
test('disabled modules are not queried or disclosed; RO empty response and canonical timezone fallback', async () => {
  const disabled = fixture();
  await answerAgendaQuery(disabled.client, org, new Set(), intent, now);
  assert.equal(disabled.requests.length, 0);
  for (const moduleId of ['tasks','calendar']) {
    const f = fixture({ organization_profiles: { body: null } });
    const response = await answerAgendaQuery(f.client, org, new Set([moduleId]), { period:'tomorrow', english:false }, now);
    assert.equal(f.requests.length, 2);
    assert.ok(f.requests[1].url.pathname.endsWith(moduleId === 'tasks' ? 'ops_tasks' : 'calendar_events'));
    assert.equal(response.facts.length, 1);
    assert.equal(response.facts[0].value, '0');
    assert.match(response.answer, /Mâine · Europe\/Bucharest/);
    assert.deepEqual(response.actions, []);
  }
});
test('profile errors, invalid timezone and incomplete counts fail instead of claiming an empty agenda', async () => {
  await assert.rejects(answerAgendaQuery(fixture().client, '', new Set(['tasks']), intent, now));
  for (const overrides of [
    { organization_profiles: { body: { message:'denied' }, status:403 } },
    { organization_profiles: { body: { timezone:'invalid-zone' } } },
    { ops_tasks: { body: [] } },
    { calendar_events: { body: { message:'denied' }, status:403 } },
  ]) await assert.rejects(answerAgendaQuery(fixture(overrides).client, org, new Set(['tasks','calendar']), intent, now));
});
test('canonical dispatcher remains behind tenant auth, entitlements and mutation rejection', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
  const route = read('app/api/ai/intelligence/route.ts');
  const entry = read('lib/ai/operational-query-entry.ts');
  const query = read('lib/ai/operational-query.ts');
  assert.ok(route.indexOf('await authenticateBillingActor') < route.indexOf('await answerOperationalQueryForActor'));
  assert.match(entry, /organization_entitlements/);
  assert.match(entry, /organization_modules/);
  assert.match(query, /answerAgendaQuery\(createBillingServiceClient\(actor\), actor.organizationId, available,/);
  assert.doesNotMatch(query, /\.(insert|update|delete|upsert)\s*\(/);
});

test('calendar-only questions never query or count tasks', async () => {
  const parsed = detectAgendaQuery('Ce am mâine în calendar?');
  assert.deepEqual(parsed, { period: 'tomorrow', english: false, scope: 'calendar' });
  const f = fixture();
  const response = await answerAgendaQuery(f.client, org, new Set(['tasks','calendar']), parsed, now);
  assert.equal(response.facts.length, 1);
  assert.ok(f.requests.every(r => !r.url.pathname.endsWith('ops_tasks')));
});
