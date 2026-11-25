// floorplan graph queries, shared by the viewer (as page tools for the Claude app) and by
// floorplan/query.mjs (as a CLI that the Claude Code CLI or Codex calls). Plain script: no imports, no exports.
// Item ids: n:<node id>  f:<file path>  r:<route index>  s:<file path>#<export index>

function createGraphQuery(G) {
  const nodes = new Map(G.nodes.map((n) => [n.id, n]));
  const files = new Map(G.files.map((f) => [f.p, f]));
  const routes = G.routes || [];
  const routesByFile = new Map();
  routes.forEach((r, i) => { if (!routesByFile.has(r.f)) routesByFile.set(r.f, []); routesByFile.get(r.f).push(i); });
  const kidsOf = new Map();
  for (const n of G.nodes) if (n.parent) { if (!kidsOf.has(n.parent)) kidsOf.set(n.parent, []); kidsOf.get(n.parent).push(n.id); }

  const nodeChain = (id) => { const out = []; let n = nodes.get(id); while (n) { out.push(n.id); n = n.parent ? nodes.get(n.parent) : null; } return out; };
  /** The node ids an item lives under, deepest first. */
  function owners(id) {
    if (id.startsWith('n:')) return nodeChain(id.slice(2));
    if (id.startsWith('f:')) { const f = files.get(id.slice(2)); return f ? nodeChain(f.n) : []; }
    if (id.startsWith('r:')) { const r = routes[+id.slice(2)]; return r ? owners('f:' + r.f) : []; }
    if (id.startsWith('s:')) return owners('f:' + id.slice(2).replace(/#\d+$/, ''));
    return [];
  }
  function brief(id) {
    if (id.startsWith('n:')) { const n = nodes.get(id.slice(2)); return n && { id, type: n.kind === 'external' ? 'external' : 'module', name: n.label, description: n.summary || '' }; }
    if (id.startsWith('f:')) { const f = files.get(id.slice(2)); return f && { id, type: 'file', name: f.name, description: f.d || '', path: f.p }; }
    if (id.startsWith('r:')) { const r = routes[+id.slice(2)]; return r && { id, type: 'endpoint', name: r.name, description: r.d || '', path: `${r.m} ${r.p}` }; }
    if (id.startsWith('s:')) {
      const m = /^s:(.*)#(\d+)$/.exec(id); const f = m && files.get(m[1]); const s = f?.s?.[+m[2]];
      return s && { id, type: s[1], name: s[0], description: s[4] || '', path: `${f.p}:${s[2]}` };
    }
    return null;
  }
  const exists = (id) => !!brief(id);
  const inside = (x, container) => x === container || (container.startsWith('n:') && owners(x).includes(container.slice(2))) || (container.startsWith('f:') && (x.startsWith('r:') ? 'f:' + routes[+x.slice(2)].f === container : x.startsWith('s:') ? 'f:' + x.slice(2).replace(/#\d+$/, '') === container : false));
  const ownerItem = (endpoint) => endpoint.startsWith('f:') ? 'n:' + (files.get(endpoint.slice(2))?.n || '') : endpoint;

  /** Accepts an id, or what people naturally pass: a file path, a module id, or "GET /path". */
  function normId(id) {
    id = String(id || '').trim().replace(/^\.\//, '').replace(/\\/g, '/');
    if (brief(id)) return id;
    if (files.has(id)) return 'f:' + id;
    if (nodes.has(id)) return 'n:' + id;
    const m = /^([A-Z]+)\s+(\/\S*)$/i.exec(id);
    if (m) { const ri = routes.findIndex((r) => r.m === m[1].toUpperCase() && r.p === m[2]); if (ri >= 0) return 'r:' + ri; }
    return id;
  }

  const FILLER = new Set(['how', 'does', 'do', 'did', 'the', 'a', 'an', 'is', 'are', 'where', 'what', 'which', 'who', 'of', 'to', 'for', 'in', 'on', 'and', 'or', 'we', 'i', 'my', 'our', 'it', 'work', 'works', 'happen', 'happens', 'get', 'gets', 'with']);
  function find(query, kind, limit = 15) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    const terms = words.filter((t) => !FILLER.has(t)).length ? words.filter((t) => !FILLER.has(t)) : words;
    if (!terms.length) return [];
    const pool = [];
    if (!kind || kind === 'module') for (const n of G.nodes) pool.push(['n:' + n.id, n.label, n.summary || '', n.id, 4]);
    if (!kind || kind === 'file') for (const f of G.files) pool.push(['f:' + f.p, f.name, f.d || '', f.p, 3]);
    if (!kind || kind === 'endpoint') routes.forEach((r, i) => pool.push(['r:' + i, r.name, r.d || '', `${r.m} ${r.p}`, 3]));
    if (!kind || kind === 'symbol') for (const f of G.files) (f.s || []).forEach((s, i) => pool.push([`s:${f.p}#${i}`, s[0], s[4] || '', f.p, 1]));
    // everything matching every word; if nothing does, the best partial matches
    const scored = [];
    for (const [id, name, desc, p, w] of pool) {
      const n = name.toLowerCase(), d = desc.toLowerCase(), pp = p.toLowerCase();
      let s = 0, hit = 0;
      for (const t of terms) {
        const sc = n === t ? 30 : n.startsWith(t) ? 20 : n.includes(t) ? 12 : pp.includes(t) ? 7 : d.includes(t) ? 5 : 0;
        if (sc) { s += sc; hit++; }
      }
      if (hit) scored.push([hit, s + w * 2 - n.length * 0.02, id]);
    }
    const best = Math.max(0, ...scored.map((x) => x[0]));
    const floor = best === terms.length ? best : Math.max(1, Math.ceil(terms.length / 2));
    return scored.filter((x) => x[0] >= floor).sort((a, b) => b[0] - a[0] || b[1] - a[1])
      .slice(0, Math.min(Number(limit) || 15, 40)).map(([, , id]) => brief(id));
  }

  function connections(id, max = 15) {
    const out = new Map(), inn = new Map();
    for (const l of G.links) {
      const ia = inside(l.a, id), ib = inside(l.b, id);
      if (ia === ib) continue;
      const other = ia ? l.b : l.a;
      const key = (id.startsWith('n:') ? ownerItem(other) : other) + '|' + l.k;
      const m = ia ? out : inn;
      const cur = m.get(key) || { id: key.split('|')[0], via: l.k, weight: 0, endpoints: new Set() };
      cur.weight += l.w;
      for (const [ri] of l.calls || []) if (ri != null) cur.endpoints.add(ri);
      m.set(key, cur);
    }
    const fmt = (m) => [...m.values()].sort((a, b) => b.weight - a.weight).slice(0, max).map((c) => ({
      ...brief(c.id), via: c.via, weight: c.weight,
      ...(c.endpoints.size ? { endpoints: [...c.endpoints].slice(0, 6).map((ri) => `r:${ri} ${routes[ri].m} ${routes[ri].p}`) } : {}),
    })).filter((x) => x.id);
    return { dependsOn: fmt(out), usedBy: fmt(inn) };
  }

  function show(id) {
    id = normId(id);
    const b = brief(id);
    if (!b) throw new Error(`Unknown id "${id}". Use find first; ids look like n:api, f:src/app.ts, r:12, s:src/app.ts#3.`);
    const parent = owners(id)[id.startsWith('n:') ? 1 : 0];
    const res = { ...b, ...(parent ? { partOf: brief('n:' + parent) && { id: 'n:' + parent, name: nodes.get(parent).label } } : {}) };
    const recent = (G.recent?.items || []).filter((x) => x.id === id);
    if (recent.length) res.recentWork = recent.map((x) => `${G.recent.tasks[x.task]?.title}: ${x.note}`);
    if (id.startsWith('n:')) {
      const n = nodes.get(id.slice(2));
      if (n.details) res.details = n.details;
      res.size = { files: n.stats.files, loc: n.stats.loc };
      res.children = (kidsOf.get(n.id) || []).map((k) => ({ id: 'n:' + k, name: nodes.get(k).label, description: nodes.get(k).summary || '' }));
      const fl = G.files.filter((f) => owners('f:' + f.p).includes(n.id)).sort((a, z) => z.loc - a.loc);
      res.files = fl.slice(0, 12).map((f) => ({ id: 'f:' + f.p, name: f.name, description: f.d || '' }));
      if (fl.length > 12) res.moreFiles = fl.length - 12;
      res.endpoints = routes.filter((r) => owners('f:' + r.f).includes(n.id)).length;
      Object.assign(res, connections(id));
    } else if (id.startsWith('f:')) {
      const f = files.get(id.slice(2));
      Object.assign(res, { loc: f.loc, module: { id: 'n:' + f.n, name: nodes.get(f.n)?.label }, ...(f.note ? { note: f.note } : {}) });
      const rs = routesByFile.get(f.p) || [];
      if (rs.length) res.endpoints = rs.slice(0, 40).map((ri) => ({ id: 'r:' + ri, method: routes[ri].m, path: routes[ri].p, name: routes[ri].name }));
      const handlers = new Set(rs.map((ri) => routes[ri].h));
      const ex = (f.s || []).map((s, i) => [s, i]).filter(([s]) => !handlers.has(s[0]));
      if (ex.length) res.exports = ex.slice(0, 30).map(([s, i]) => `s:${f.p}#${i} ${s[0]} (${s[1]})`);
      Object.assign(res, connections(id, 20));
    } else if (id.startsWith('r:')) {
      const ri = +id.slice(2), r = routes[ri];
      Object.assign(res, { method: r.m, routePath: r.p, handler: r.h, line: r.l, file: { id: 'f:' + r.f, name: files.get(r.f)?.name } });
      const callers = new Map();
      for (const l of G.links) { const n = (l.calls || []).filter(([x]) => x === ri).length; if (n) callers.set(l.a, (callers.get(l.a) || 0) + n); }
      res.calledFrom = [...callers.entries()].map(([a, n]) => ({ ...brief(a), calls: n }));
    } else {
      const m = /^s:(.*)#(\d+)$/.exec(id); const f = files.get(m[1]); const s = f.s[+m[2]];
      res.file = { id: 'f:' + f.p, name: f.name };
      res.importedBy = G.links.filter((l) => l.b === 'f:' + f.p && (l.names || []).some((nm) => nm === s[0] || (nm === 'default' && s[3]))).slice(0, 25).map((l) => brief(l.a));
    }
    return res;
  }

  /** Shortest dependency chain from anything inside `from` to anything inside `to`. */
  function path(from, to) {
    from = normId(from); to = normId(to);
    if (!exists(from) || !exists(to)) throw new Error('Unknown id; use find first.');
    const adj = new Map();
    const add = (a, b, l) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push([b, l]); };
    for (const l of G.links) add(l.a, l.b, l);
    const starts = [...new Set([...G.links.map((l) => l.a), ...G.links.map((l) => l.b)])].filter((x) => inside(x, from));
    const isGoal = (x) => inside(x, to);
    const prev = new Map(starts.map((s) => [s, null]));
    const queue = [...starts];
    let goal = null;
    while (queue.length && !goal) {
      const x = queue.shift();
      for (const [y, l] of adj.get(x) || []) {
        if (prev.has(y)) continue;
        prev.set(y, [x, l]);
        if (isGoal(y)) { goal = y; break; }
        queue.push(y);
      }
    }
    if (!goal) return { found: false, note: `No chain of imports/calls leads from ${from} to ${to}. Try the reverse direction, or the two may only meet through a shared dependency.` };
    const hops = [];
    for (let x = goal; prev.get(x); x = prev.get(x)[0]) {
      const [p, l] = prev.get(x);
      hops.unshift({ from: brief(p), to: brief(x), via: l.k, ...(l.calls?.length ? { endpoints: l.calls.slice(0, 3).map(([ri]) => ri != null ? `r:${ri} ${routes[ri].m} ${routes[ri].p}` : '').filter(Boolean) } : {}) });
    }
    return { found: true, hops: hops.slice(0, 15) };
  }

  function overview() {
    return {
      project: G.project.name, summary: G.project.summary || '',
      systems: G.nodes.filter((n) => !n.parent).map((n) => ({ id: 'n:' + n.id, name: n.label, kind: n.kind, description: n.summary || '', modules: (kidsOf.get(n.id) || []).map((k) => `n:${k} ${nodes.get(k).label}`) })),
      flows: (G.flows || []).map((f) => ({ title: f.title, steps: f.steps.map((s) => `${s.ref} ${s.note}`) })),
      counts: { files: G.files.length, endpoints: routes.length },
      ...(G.recent ? { recentWork: (G.recent.tasks || []).map((t, ti) => ({ title: t.title, request: t.request, summary: t.summary, changed: G.recent.items.filter((x) => x.task === ti).map((x) => `${x.id} ${x.note}`) })) } : {}),
    };
  }

  return { find, show, path, overview, exists, brief };
}

// What an answer looks like, for both engines (JSON Schema).
const FLOORPLAN_ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '这块回答的短标题，大约十个字以内，用通俗简体中文。' },
    answer: { type: 'string', description: '用 Markdown 写的回答，大约 180 个词以内，通俗简体中文。提到地图上的东西时写成 [[id]]。' },
    items: { type: 'array', description: '和回答最相关的 3 到 14 张卡片，最重要的放前面。', items: { type: 'object', properties: { id: { type: 'string' }, note: { type: 'string', description: '它在这里起什么作用，大约 15 个字以内，用通俗简体中文。' } }, required: ['id', 'note'] } },
    steps: { type: 'array', description: '回答是一件事的先后顺序时（一次请求怎么走、数据怎么流），按顺序写；否则留空。', items: { type: 'object', properties: { id: { type: 'string' }, note: { type: 'string' } }, required: ['id', 'note'] } },
    followups: { type: 'array', description: '对方接下来可能会问的 2 到 3 个短问题，用通俗简体中文。', items: { type: 'string' } },
  },
  required: ['title', 'answer', 'items'],
};

// A requested flow: an ordered walkthrough of map items (JSON Schema).
const FLOORPLAN_FLOW_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '流程的短标题，大约十个字以内，用通俗简体中文，例如「从结账到 Stripe 收款」。' },
    description: { type: 'string', description: '一句话说明这条流程在讲什么，用通俗简体中文。' },
    steps: { type: 'array', description: '按事情发生的顺序写 3 到 9 步，每步是地图上的一项，以及那里发生了什么。', items: { type: 'object', properties: { id: { type: 'string' }, note: { type: 'string', description: '这一步发生了什么，大约 18 个字以内，用通俗简体中文。' } }, required: ['id', 'note'] } },
  },
  required: ['title', 'steps'],
};

// A requested change to a blueprint: the whole updated plan.json and architecture.json, and what changed
// (JSON Schema). The documents travel as JSON text so the schema stays the same for every engine.
const FLOORPLAN_CHANGE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '改了什么，2 到 6 个词，用通俗简体中文，例如「把付款规划进去了」。' },
    summary: { type: 'string', description: 'Markdown，大约 150 个词以内，用通俗简体中文：加了、改了或删了什么，以及为什么，再加上新的假设或还没定的问题。' },
    plan: { type: 'string', description: '完整更新后的 floorplan/plan.json，用 JSON 文本。' },
    architecture: { type: 'string', description: '完整更新后的 floorplan/architecture.json，用 JSON 文本。' },
    changes: { type: 'array', description: '每一张新增或改过的卡片：文件路径、节点 id 或 "METHOD /path"。', items: { type: 'object', properties: { ref: { type: 'string' }, change: { type: 'string', enum: ['new', 'changed'] }, note: { type: 'string', description: '这张卡片怎么服务于这次请求，一句通俗简体中文。' } }, required: ['ref', 'change', 'note'] } },
    followups: { type: 'array', description: '对方接下来可能会要求的 2 到 3 个短改动，用通俗简体中文。', items: { type: 'string' } },
  },
  required: ['title', 'summary', 'plan', 'architecture', 'changes'],
};

function floorplanChangeInstructions(G) {
  const src = G.meta?.blueprint?.source;
  return [
    `你在改一张规划蓝图：这是「${G.project.name}」的一张可点开的地图，系统还在计划里，还没做出来。看地图的人要求改、加或删（「把付款也规划进去」「不要管理页了」「店员用 Google 登录」），你来更新这份计划。`,
    '输出语言（必须遵守）：无论需求文档是什么语言，名称、说明、流程讲解、假设和还没定的问题，全部用通俗简体中文。代码路径、变量名、接口 URL、JSON 字段名保持原样。',
    `先读 floorplan/plan.json 和 floorplan/architecture.json${src ? `；请求碰到需求里写过的事时，再读 ${src}（规划所依据的需求）` : ''}。可以用 \`node floorplan/query.mjs find "<words>"\` 和 \`show <id>\` 在地图上查。`,
    'plan.json 的格式：{ source, stack[], assumptions[], questions[{question, about[]}], files[{path, name, description, screen?, uses[], calls["METHOD /path"], services[节点 id], data[节点 id]}], endpoints[{method, path, file, name, description, access: public|signed-in|team|webhook|internal, who?, publicBecause?}] }。每条接口的 file 必须是一个计划中的文件，每一次 call 必须和一条计划中的接口完全一致，services 和 data 写的是 architecture.json 里的节点。',
    'architecture.json：{ project, nodes[{id, label, kind, parent?, summary, paths[通配路径]}], edges[], flows[{id, title, steps[{node, note}]}], tour[] }。kind 只能是：ui service worker library feature data config test script infra external。外部节点（外面的服务、数据库）自己没有文件。每个计划中的文件都必须落在某个节点的 paths 下面，所以新文件夹要补上或放宽通配路径。流程和导览的步骤指向节点 id 或计划中的文件路径。',
    '只改这次请求需要的，其余照着这份计划已有的写法：同一套技术、同一种约定，给人看的话用大白话，路径用真实路径。其他文件、接口、id 和说明原样保留。需求和计划里已经定了的，照着做；新的选择写进 assumptions，真正还没定的写进 questions。请求是删掉某样东西时，把只有它才用到的一切一起删掉。请求回答了 plan.json 里的某个问题，就删掉那个问题，把答案做进计划，并记进 assumptions；如果它定了谁可以用某条接口，就设置 access（以及 who 或 publicBecause）。很多请求来自地图的设计审查：它点了什么，就正好解决什么。',
    '只回复 JSON：{"title", "summary", "plan", "architecture", "changes", "followups"}。plan 和 architecture 是完整更新后的文件，用 JSON 文本，不是只给改过的部分。changes 列出每一个新增或改过的文件、接口（"METHOD /path"）或节点 id，并写一句它怎么服务于这次请求。',
    '不要自己改任何文件：地图服务器会检查你的 JSON，保存它，再重画地图。',
  ].join('\n');
}

function floorplanFlowInstructions(G, engine) {
  return [
    `你在给「${G.project.name}」这张可点开的结构地图做引导流程。一条流程是按顺序走一遍：每一步是地图上的一项（模块 n:...、文件 f:...、接口 r:...，或导出 s:...），加上那里发生了什么。`,
    '输出语言（必须遵守）：标题、说明和每一步的讲解用通俗简体中文。代码路径、变量名、接口 URL 保持原样。',
    engine === 'cli'
      ? '用 `node floorplan/query.mjs find "<words>"`、`show <id>` 和 `path <fromId> <toId>` 找到这些项；需要确认事情的先后时，再读源文件。'
      : '用 find_items、get_item 和 dependency_path 这些工具找到这些项。',
    '从对方问的那件事的触发点（用户的一个动作、别人打来的通知、定时任务）追到最后的结果（写入数据库、调用外部服务、给出回应）。',
    '用 3 到 9 步。优先用最能把故事讲清楚的那一项（接口优于它所在的文件，文件优于它所在的模块），相邻两步必须是真的会调用或引用彼此的东西。',
    '只回复 JSON：{"title", "description", "steps": [{"id", "note"}]}。只用地图给你的 id。',
  ].join('\n');
}

function floorplanAskInstructions(G, engine) {
  const tools = engine === 'cli'
    ? `在命令行里查地图：\`node floorplan/query.mjs overview\`、\`node floorplan/query.mjs find "<words>" [--kind module|file|endpoint|symbol]\`、\`node floorplan/query.mjs show <id>\`、\`node floorplan/query.mjs path <fromId> <toId>\`。每条结果都是带 id 的 JSON。先看地图；地图上没有的细节，再去读或搜索源文件。`
    : `用 find_items、get_item 和 dependency_path 在地图上找。你读不了源文件，所以只根据地图上的名字、说明、接口和连线来回答；问题必须看代码才能答时，就直说。`;
  const bp = G.meta?.blueprint;
  return [
    `你在回答关于代码项目「${G.project.name}」的问题。对方正在看一张可点开的结构地图。`,
    '输出语言（必须遵守）：无论项目代码和注释是什么语言，回答、卡片备注、步骤讲解和后续问题全部用通俗简体中文。代码路径、变量名、接口 URL 保持原样。',
    '地图上有模块（id 形如 n:...）、文件（f:<路径>）、网页接口（r:<数字>）和导出的符号（s:<路径>#<数字>）。每张卡片都有人话名字和说明，靠引用和网页请求连在一起。',
    tools,
    bp ? `This map is a blueprint：这是一张规划蓝图，系统还没做出来，所以这些文件现在还不存在。${engine === 'cli' ? `需要比地图更多的内容时，不要去找源文件，改读 floorplan/plan.json${bp.source ? ` 和 ${bp.source}（规划所依据的材料）` : ''}。` : ''}讲将会做出什么、为什么这样排，计划没覆盖到的就直说。` : '',
    '查几次就够，不要查几十次。然后只回复 JSON：{"title", "answer", "items", "steps", "followups"}。',
    '- answer：Markdown，大约 180 个词以内，通俗而且具体。提到地图上的东西时写成 [[id]]（它们会变得可以点）。',
    '- items：最能把回答显示出来的 3 到 14 张卡片，最重要的放前面，每张用一句备注（大约 15 个字以内）说它的角色。',
    '- steps：回答是一件事的先后顺序时（一次请求怎么走、数据怎么流）按顺序写；否则 []。',
    '- followups：2 到 3 个短的后续问题。',
    '只用地图给你的 id。',
  ].filter(Boolean).join('\n');
}
