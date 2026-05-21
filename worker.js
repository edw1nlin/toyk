function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function parseSplitWith(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensurePlanColumns(env) {
  const columns = await env.DB.prepare(`PRAGMA table_info(plans)`).all();
  const names = new Set((columns.results || []).map(c => c.name));
  if (!names.has('completed')) await env.DB.prepare(`ALTER TABLE plans ADD COLUMN completed INTEGER NOT NULL DEFAULT 0`).run();
  if (!names.has('order_index')) await env.DB.prepare(`ALTER TABLE plans ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0`).run();
}

async function getExpenses(env) {
  const result = await env.DB.prepare(
    `SELECT id, day, payer, amount_jpy AS amountJPY, original_amount AS originalAmount,
            original_currency AS originalCurrency, category, note, split_with AS splitWith,
            created_at AS createdAt
     FROM expenses
     ORDER BY created_at DESC`
  ).all();
  return json({ expenses: result.results.map(row => ({ ...row, splitWith: parseSplitWith(row.splitWith) })) });
}

async function addExpense(request, env) {
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO expenses
     (id, day, payer, amount_jpy, original_amount, original_currency, category, note, split_with)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.day || '', body.payer || '', Number(body.amountJPY || 0), Number(body.originalAmount || 0), body.originalCurrency || 'JPY', body.category || 'Other', body.note || '', JSON.stringify(body.splitWith || [])).run();
  return json({ ok: true, id }, 201);
}

async function deleteExpense(request, env) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

async function getPlans(env) {
  await ensurePlanColumns(env);
  const result = await env.DB.prepare(
    `SELECT id, day, time, title, location, notes, completed, order_index AS orderIndex, created_at AS createdAt
     FROM plans
     ORDER BY day ASC, order_index ASC, time ASC, created_at ASC`
  ).all();
  return json({ plans: result.results });
}

async function addPlan(request, env) {
  await ensurePlanColumns(env);
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO plans
     (id, day, time, title, location, notes, completed, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.day || '', body.time || '', body.title || '', body.location || '', body.notes || '', Number(body.completed || 0), Number(body.orderIndex || 0)).run();
  return json({ ok: true, id }, 201);
}

async function updatePlan(request, env) {
  await ensurePlanColumns(env);
  const body = await request.json();
  if (!body.id) return json({ error: 'Missing id' }, 400);
  const existing = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(body.id).first();
  if (!existing) return json({ error: 'Plan not found' }, 404);
  await env.DB.prepare(
    `UPDATE plans
     SET day = ?, time = ?, title = ?, location = ?, notes = ?, completed = ?, order_index = ?
     WHERE id = ?`
  ).bind(
    body.day ?? existing.day,
    body.time ?? existing.time,
    body.title ?? existing.title,
    body.location ?? existing.location,
    body.notes ?? existing.notes,
    Number(body.completed ?? existing.completed ?? 0),
    Number(body.orderIndex ?? existing.order_index ?? 0),
    body.id
  ).run();
  return json({ ok: true, id: body.id });
}

async function reorderPlans(request, env) {
  await ensurePlanColumns(env);
  const body = await request.json();
  const plans = Array.isArray(body.plans) ? body.plans : [];
  const statements = plans
    .filter(p => p.id)
    .map(p => env.DB.prepare('UPDATE plans SET day = ?, order_index = ? WHERE id = ?').bind(p.day || '', Number(p.orderIndex || 0), p.id));
  if (statements.length) await env.DB.batch(statements);
  return json({ ok: true, count: statements.length });
}

async function deletePlan(request, env) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM plans WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const row = await env.DB.prepare("SELECT datetime('now') AS now").first();
      return json({ ok: true, database: 'connected', now: row.now });
    }

    if (url.pathname === '/api/expenses') {
      if (request.method === 'GET') return getExpenses(env);
      if (request.method === 'POST') return addExpense(request, env);
      if (request.method === 'DELETE') return deleteExpense(request, env);
      return json({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === '/api/plans') {
      if (request.method === 'GET') return getPlans(env);
      if (request.method === 'POST') return addPlan(request, env);
      if (request.method === 'PATCH') return updatePlan(request, env);
      if (request.method === 'DELETE') return deletePlan(request, env);
      return json({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === '/api/plans/reorder') {
      if (request.method === 'POST') return reorderPlans(request, env);
      return json({ error: 'Method not allowed' }, 405);
    }

    return env.ASSETS.fetch(request);
  }
};
