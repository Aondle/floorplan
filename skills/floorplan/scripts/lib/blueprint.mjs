// Blueprints: a floorplan of a system that hasn't been built yet, planned from a PRD or a description.
//
// planToScan(plan, root) — turns floorplan/plan.json (the planned files, endpoints and calls, written by
//                          the agent) into the same scan.json shape scan.mjs writes for real code, so
//                          build.mjs and the viewer work unchanged. Returns { scan, errors, warnings }.
// buildPlanHealth(ctx)   — called by build.mjs instead of buildHealth for a blueprint: a design review of
//                          the plan (who may call each endpoint, loose ends, open questions) in the same
//                          { summary, issues } shape, so the Health panel shows it.

import path from 'node:path';
import { classify, toPosix } from './common.mjs';
import { matchCalls } from './routes.mjs';

// who may use an endpoint. "team" is the people who run the service (its own admin pages), not the app's users.
export const ACCESS = ['public', 'signed-in', 'team', 'webhook', 'internal'];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'CALL', 'ANY'];
const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE', 'CALL']);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const strArr = (v) => (Array.isArray(v) ? v.filter(isStr) : []);
const routeKey = (m, p) => `${m} ${p}`;

/** "POST /api/orders" -> { method, path }, or null. */
export function parseCall(s) {
  const m = /^\s*([A-Za-z]+)\s+(\/\S*)\s*$/.exec(String(s || ''));
  return m && METHODS.includes(m[1].toUpperCase()) ? { method: m[1].toUpperCase(), path: m[2] } : null;
}

export function planToScan(plan, root) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  if (!plan || typeof plan !== 'object') return { scan: null, errors: ['plan.json must be an object'], warnings };
  const files = Array.isArray(plan.files) ? plan.files : [];
  const endpoints = Array.isArray(plan.endpoints) ? plan.endpoints : [];
  if (!files.length) err('files must be a non-empty array of the files the system would have');

  const byPath = new Map();
  files.forEach((f, i) => {
    const where = `files[${i}]${f?.path ? ` ("${f.path}")` : ''}`;
    if (!isStr(f?.path)) return err(`${where}.path is required`);
    const p = toPosix(f.path.trim()).replace(/^\.\//, '');
    if (p.startsWith('/') || p.includes('..')) return err(`${where}.path must be relative to the project folder`);
    if (byPath.has(p)) return err(`${where}.path duplicates an earlier file`);
    if (!isStr(f.description)) warn(`${where} has no description`);
    byPath.set(p, f);
  });
  const known = [...byPath.keys()];
  const near = (p) => { const base = p.split('/').pop(); const hit = known.find((k) => k.split('/').pop() === base); return hit ? ` (did you mean "${hit}"?)` : ''; };

  // endpoints, keyed by "METHOD /path"
  const routes = [], access = {}, seen = new Set();
  endpoints.forEach((e, i) => {
    const where = `endpoints[${i}]${e?.method && e?.path ? ` ("${e.method} ${e.path}")` : ''}`;
    const method = String(e?.method || '').toUpperCase();
    if (!METHODS.includes(method)) return err(`${where}.method must be one of ${METHODS.join(', ')}`);
    if (!isStr(e.path) || !e.path.startsWith('/')) return err(`${where}.path must start with "/"`);
    if (!isStr(e.file)) return err(`${where}.file is required: the planned file that handles it`);
    const file = toPosix(e.file.trim()).replace(/^\.\//, '');
    if (!byPath.has(file)) return err(`${where}.file "${file}" is not one of the planned files${near(file)}`);
    const key = routeKey(method, e.path);
    if (seen.has(key)) return err(`${where} duplicates an earlier endpoint`);
    seen.add(key);
    if (e.access !== undefined && !ACCESS.includes(e.access)) err(`${where}.access "${e.access}" must be one of ${ACCESS.join(', ')}${e.access === 'staff' ? ' ("team" is your own team; for some of the app’s users, use "signed-in" with "who")' : ''}`);
    if (e.who !== undefined && !isStr(e.who)) err(`${where}.who must be a few words, e.g. "managers of that location"`);
    if (e.publicBecause !== undefined && !isStr(e.publicBecause)) err(`${where}.publicBecause must say why it is open to anyone`);
    if (ACCESS.includes(e.access)) access[key] = e.access;
    routes.push({ file, method, path: e.path, line: 0, ...(ACCESS.includes(e.access) ? { access: e.access } : {}), ...(isStr(e.who) ? { who: e.who.trim() } : {}), ...(isStr(e.publicBecause) ? { publicBecause: e.publicBecause.trim() } : {}), ...(isStr(e.name) ? { name: e.name.trim() } : {}), ...(isStr(e.description) ? { desc: e.description.trim() } : {}) });
  });
  const routeKeys = new Set(routes.map((r) => routeKey(r.method, r.path)));

  // imports, calls, and links to outside services and data stores
  const edges = [], nodeLinks = [], callFiles = [];
  for (const [p, f] of byPath) {
    for (const u of strArr(f.uses)) {
      const to = toPosix(u.trim()).replace(/^\.\//, '');
      if (!byPath.has(to)) { err(`files "${p}".uses "${u}" is not one of the planned files${near(to)}`); continue; }
      if (to !== p) edges.push({ from: p, to });
    }
    const calls = [];
    for (const c of strArr(f.calls)) {
      const pc = parseCall(c);
      if (!pc) { err(`files "${p}".calls "${c}" must look like "POST /api/orders"`); continue; }
      if (!routeKeys.has(routeKey(pc.method, pc.path))) warn(`files "${p}".calls "${c}" matches no planned endpoint`);
      calls.push({ path: pc.path, method: pc.method, line: 0 });
    }
    if (calls.length) callFiles.push({ path: p, calls });
    for (const s of strArr(f.services)) nodeLinks.push({ from: p, to: s.trim(), kind: 'http' });
    for (const d of strArr(f.data)) nodeLinks.push({ from: p, to: d.trim(), kind: 'data' });
  }
  // calls only reach the exact planned endpoint (method and path), never a near miss
  const http = matchCalls(callFiles, routes).filter((h) => routeKeys.has(routeKey(h.method, h.path)) && h.call === h.path);

  const questions = [];
  (Array.isArray(plan.questions) ? plan.questions : []).forEach((q, i) => {
    const text = isStr(q) ? q : q?.question;
    if (!isStr(text)) return err(`questions[${i}] needs a question`);
    questions.push({ question: text.trim(), about: strArr(q?.about) });
  });

  const scan = {
    version: 1,
    blueprint: {
      source: isStr(plan.source) ? plan.source.trim() : '',
      stack: strArr(plan.stack),
      assumptions: strArr(plan.assumptions),
      questions,
      access,
    },
    generatedAt: new Date().toISOString(),
    root: toPosix(root),
    rootName: path.basename(root),
    repos: [],
    files: [...byPath].map(([p, f]) => {
      const c = classify(p, 0);
      return {
        path: p, repo: null, category: 'code', lang: c.lang || path.posix.extname(p).slice(1) || null, loc: 0, bytes: 0,
        ...(isStr(f.name) ? { name: f.name.trim() } : {}),
        ...(isStr(f.description) ? { desc: f.description.trim() } : {}),
        ...(isStr(f.screen) && f.screen.startsWith('/') ? { screens: [{ fw: 'plan', url: f.screen.trim() }] } : {}),
      };
    }),
    edges,
    externals: [],
    extEdges: [],
    routes,
    http,
    hosts: [],
    nodeLinks,
  };
  return { scan, errors, warnings };
}

/** The design review shown in the Health panel for a blueprint. */
export function buildPlanHealth({ graph, scan }) {
  const bp = scan.blueprint || {};
  const issues = [];
  const routes = graph.routes || [];
  const ridOf = new Map(routes.map((r, i) => [routeKey(r.m, r.p), 'r:' + i]));
  const fileIds = new Set(graph.files.map((f) => 'f:' + f.p));
  const nodeIds = new Set(graph.nodes.map((n) => 'n:' + n.id));
  const refOf = (s) => {
    if (!isStr(s)) return null;
    const t = s.trim();
    if (nodeIds.has('n:' + t)) return 'n:' + t;
    if (fileIds.has('f:' + t)) return 'f:' + t;
    const pc = parseCall(t);
    return pc ? ridOf.get(routeKey(pc.method, pc.path)) || null : null;
  };
  const line = (r) => `- ${r.m} ${r.p} (${r.f})${r.name ? ` — ${r.name}` : ''}`;
  const rebuild = '然后按这个技能的说明，从 Floorplan 技能里运行 plan.mjs 和 build.mjs，重新生成规划蓝图。';
  // each item also carries `change`: a request to settle it from the map (the Ask bar's Change mode), for the person to finish or edit
  const names = (xs, max = 6) => { const l = xs.slice(0, max).concat(xs.length > max ? [`还有 ${xs.length - max} 个`] : []); return l.length < 2 ? l.join('') : `${l.slice(0, -1).join('、')}和${l.at(-1)}`; };
  const ep = (r) => `${r.m} ${r.p}`;

  // ---------- who may call each endpoint ----------
  const accessOf = (r) => bp.access?.[routeKey(r.m, r.p)];
  // open on purpose, with a reason (publicBecause), counts as reviewed
  const openWrites = routes.map((r, i) => ({ r, i })).filter(({ r }) => accessOf(r) === 'public' && WRITE.has(r.m) && !r.publicBecause);
  if (openWrites.length) issues.push({
    id: 'plan-open-writes', kind: 'unprotected-endpoint', severity: 'medium',
    change: `看一看谁可以用 ${names(openWrites.map(({ r }) => ep(r)))}：现在谁都能用${openWrites.length === 1 ? '它' : '它们'}改数据。 `,
    title: openWrites.length === 1 ? '谁都能通过一个计划中的接口改数据' : `谁都能通过 ${openWrites.length} 个计划中的接口改数据`,
    detail: `规划让${openWrites.length === 1 ? '这个接口' : '这些接口'}在不登录的情况下新建、修改或删除数据。注册、游客结账这类可以，但做出来之前值得再看一眼：${openWrites.length === 1 ? '它' : '它们'}是陌生人最容易拿来乱用的。`,
    items: openWrites.slice(0, 24).map(({ i }) => 'r:' + i),
    notes: Object.fromEntries(openWrites.slice(0, 24).map(({ i }) => ['r:' + i, '规划成谁都能用，而且会改数据'])),
    locations: [],
    fix: [`设计审查 floorplan/plan.json：这些计划中的接口会改数据，并且标了 "access": "public"：`, ...openWrites.map(({ r }) => line(r)), ``, `每一个都用大白话告诉我：陌生人是不是真的该能用它。不该的，在 plan.json 里把 access 改成 "signed-in"（只有一部分人可以用时再写上 "who"）。必须保持公开的（登录、注册、游客结账），用 "publicBecause" 写明原因，包括怎么限制滥用（频率限制、验证码、邮件确认）。拿不准就问我。`, rebuild].join('\n'),
  });
  const unknown = routes.map((r, i) => ({ r, i })).filter(({ r }) => !accessOf(r));
  if (unknown.length) issues.push({
    id: 'plan-no-access', kind: 'unprotected-endpoint', severity: 'medium',
    change: `按需求定谁可以用 ${names(unknown.map(({ r }) => ep(r)))}。 `,
    title: unknown.length === 1 ? '规划没写明一个接口谁可以用' : `规划没写明 ${unknown.length} 个接口谁可以用`,
    detail: `现在就定下系统里每一块谁可以用（任何人、登录了的顾客、只有管理员、你们自己的团队、另一个服务），比做出来再补登录检查容易得多。`,
    items: unknown.slice(0, 24).map(({ i }) => 'r:' + i),
    notes: Object.fromEntries(unknown.slice(0, 24).map(({ i }) => ['r:' + i, '谁可以用还没定'])),
    locations: [],
    fix: [`设计审查 floorplan/plan.json：这些计划中的接口没有设 "access"：`, ...unknown.map(({ r }) => line(r)), ``, `每一个都选定谁可以用："public"（任何人）、"signed-in"（只有一部分人可以用时再加上 "who"，比如「那个门店的管理员」）、"team"（只有运营这个服务的人）、"webhook"（另一家的服务，而且必须证明是它）或 "internal"（只有我们自己的服务）。按需求来；需求没写的地方问我。`, rebuild].join('\n'),
  });

  // ---------- open questions from the PRD ----------
  bp.questions?.forEach((q, k) => {
    const items = [...new Set(q.about.map(refOf).filter(Boolean))];
    issues.push({
      id: 'plan-question:' + k, kind: 'question', severity: 'medium',
      change: `还没定的问题：「${q.question}」我的回答： `,
      title: q.question,
      detail: '需求没回答这个，而答案会改变要做出来的东西。做它碰到的那些部分之前，先定下来。',
      items, notes: Object.fromEntries(items.map((id) => [id, '取决于一个还没定的问题'])),
      locations: [],
      fix: [`规划蓝图里还没定的问题（floorplan/plan.json）：${q.question}`, ``, `用大白话给我讲选项，以及每种对它碰到的部分意味着什么${q.about.length ? `（${q.about.join('、')}）` : ''}，并推荐一个。我定了之后，按决定更新 plan.json 和 architecture.json，并从 plan.json 的 questions 里删掉这个问题。`, rebuild].join('\n'),
    });
  });

  // ---------- loose ends ----------
  const called = new Set(graph.links.filter((l) => l.k === 'http' && l.calls).flatMap((l) => l.calls.map(([ri]) => ri)));
  const unusedRoutes = routes.map((r, i) => ({ r, i })).filter(({ r, i }) => !called.has(i) && !['webhook', 'internal', 'public'].includes(accessOf(r)));
  if (unusedRoutes.length) issues.push({
    id: 'plan-unused-endpoints', kind: 'unused-file', severity: 'low',
    change: `规划里没有人调用 ${names(unusedRoutes.map(({ r }) => ep(r)))}。补上应该用${unusedRoutes.length === 1 ? '它' : '它们'}的页面或服务，不需要的话就去掉。 `,
    title: unusedRoutes.length === 1 ? '规划里没有人用到一个接口' : `规划里没有人用到 ${unusedRoutes.length} 个接口`,
    detail: `没有计划中的页面或服务会调用${unusedRoutes.length === 1 ? '它' : '它们'}。要么是需要${unusedRoutes.length === 1 ? '它' : '它们'}的页面没写进规划，要么${unusedRoutes.length === 1 ? '它' : '它们'}其实不需要。`,
    items: unusedRoutes.slice(0, 24).map(({ i }) => 'r:' + i),
    notes: Object.fromEntries(unusedRoutes.slice(0, 24).map(({ i }) => ['r:' + i, '没有计划中的调用方'])),
    locations: [],
    fix: [`设计审查 floorplan/plan.json：规划里没有人调用这些接口：`, ...unusedRoutes.map(({ r }) => line(r)), ``, `每一个都找出应该调用它的计划中页面或服务，加进那个文件的 "calls"；或者告诉我它不需要，然后删掉。`, rebuild].join('\n'),
  });
  const linked = new Set();
  for (const l of graph.links) { linked.add(l.a); linked.add(l.b); }
  const screenFiles = new Set((graph.screens || []).map((s) => s.file));
  const routeFiles = new Set(routes.map((r) => r.f));
  const loose = graph.files.filter((f) => !linked.has('f:' + f.p) && !screenFiles.has(f.p) && !routeFiles.has(f.p));
  if (loose.length) issues.push({
    id: 'plan-loose-files', kind: 'unused-file', severity: 'low',
    change: `${names(loose.map((f) => f.p))} 什么都没连上。把${loose.length === 1 ? '它' : '它们'}连到该用${loose.length === 1 ? '它' : '它们'}的地方，或者删掉。 `,
    title: loose.length === 1 ? '有一个计划中的文件什么都没连上' : `${loose.length} 个计划中的文件什么都没连上`,
    detail: `规划里没有人用${loose.length === 1 ? '它' : '它们'}，${loose.length === 1 ? '它' : '它们'}也没用任何东西。通常是规划里少了一条连接。`,
    items: loose.slice(0, 24).map((f) => 'f:' + f.p),
    notes: Object.fromEntries(loose.slice(0, 24).map((f) => ['f:' + f.p, '在规划里什么都没连上'])),
    locations: [],
    fix: [`设计审查 floorplan/plan.json：这些计划中的文件什么都没连上：`, ...loose.map((f) => `- ${f.p}`), ``, `补上缺的 "uses"、"calls"、"services" 或 "data"，或者删掉不需要的文件。`, rebuild].join('\n'),
  });

  const ORDER = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const summary = { high: 0, medium: 0, low: 0 };
  for (const i of issues) summary[i.severity]++;
  return { summary, issues: issues.slice(0, 40), review: true };
}
