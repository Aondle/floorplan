// floorplan glossary: explains the technical words a non-developer meets on the map.
// The first time a known term appears in a description (details panel, board title area), it gets a
// dotted underline; hovering or focusing it shows a one-sentence explanation. Off while
// "Show technical detail" is on. Talks to the viewer only through window.Floorplan.
(() => {
  const SC = window.Floorplan;
  if (!SC) return;

  // [display name, plain explanation, aliases...]. Aliases are matched as whole words, ignoring case,
  // except those marked with a leading "=" (matched exactly, so "REST" doesn't fire on "the rest").
  const TERMS = [
    ['接口（API）', '程序之间怎么对话：一边要一样东西（价格、一笔订单），另一边回答。', 'API', 'APIs', 'API client'],
    ['接口', '应用能接到的一种请求，比如「把这单标成已发货」；每种都有自己的网址。', 'endpoint', 'endpoints'],
    ['通知（Webhook）', '别的服务那边有事发生时，主动发给你的应用的一条消息，比如「钱到了」。', 'webhook', 'webhooks'],
    ['服务器', '云上的一台电脑，干应用背后的活，并回答页面发来的请求。', 'server', 'servers', 'main server'],
    ['页面这边', '人看得到、点得到的部分：浏览器里的页面、按钮和表单。', 'frontend', 'front end', 'front-end'],
    ['服务器这边', '藏在背后的部分：存记录、执行规则、跟别的服务说话。', 'backend', 'back end', 'back-end'],
    ['数据库', '应用存放记录的地方（商品、订单、顾客），重启也不会丢。', 'database', 'databases', 'DB'],
    ['记录', '数据库里存下的一条，比如一笔订单或一位顾客；表就是同一类记录的清单。', 'database record', 'database records', 'database table', 'database tables'],
    ['数据模型', '代码里，模型描述某一种记录（订单、顾客）在数据库里怎么存。', 'model', 'models', 'ORM', 'ORM model', 'ORM models', 'data model'],
    ['查询', '应用问数据库的一个问题，比如「今天还没发出去的订单」。', 'query', 'queries'],
    ['队列', '任务排的队：活先放进去，后台一个一个处理，免得丢掉。', 'queue', 'queues', 'queued', 'outbox', 'message queue'],
    ['后台任务', '自己在背后跑的一件事，人不用在页面上等它。', 'background job', 'background jobs', 'background task', 'background tasks', 'worker', 'workers'],
    ['定时任务', '按时间表自动跑的事，比如每小时或每天夜里。', 'cron', 'cron job', 'cron jobs', 'scheduled job', 'scheduled jobs', 'scheduler'],
    ['环境变量', '存在代码外面的一项设置，比如用哪个数据库、哪个账号，测试和正式可以不一样。', 'environment variable', 'environment variables', 'env var', 'env vars', '.env'],
    ['密钥', '应用用来登录另一个服务的密码或钥匙；不能分享，也不能写进代码。', 'secret', 'secrets', 'API key', 'API keys', 'credentials'],
    ['发布', '把应用的新版本放到线上，让人开始用。', 'deploy', 'deploys', 'deployed', 'deployment', 'deployments'],
    ['迁移', '记录的存法有一次改动，比如给每笔订单加一个新字段。', 'migration', 'migrations'],
    ['缓存', '就近存的一份副本，下次打开更快，不用重新算。', 'cache', 'cached', 'caching'],
    ['登录', '放进来之前先确认是谁（通常靠密码）。', 'auth', 'authentication', 'login', 'log in', 'sign-in', 'sign in'],
    ['权限', '谁可以做什么的规则，比如只有店长能退款。', 'permissions', 'authorization', 'roles', 'RBAC'],
    ['登录状态', '应用记住你已经登录，不用每个页面都再输一遍密码。', 'session', 'sessions'],
    ['通行证', '登录之后发给你的一张临时电子通行证，之后每个请求都要核对。', 'token', 'tokens', 'bearer token', 'access token'],
    ['现成代码包（SDK）', '一家公司准备好的一套代码，让应用更容易跟它的服务说话。', 'SDK', 'SDKs'],
    ['仓库', '放着一个项目全部代码、以及每一次改动记录的文件夹。', 'repository', 'repositories', 'repo', 'repos'],
    ['组件', '页面上可以反复用的积木，比如一个按钮、一张表，或整个商品编辑器。', 'component', 'components'],
    ['路由', '应用会应答的一个网址：在页面上它是一页，在服务器上它是一种请求。', 'route', 'routes', 'routing', 'App Router'],
    ['请求', '让服务器去做一件事或取一样东西的消息；服务器再带回结果。', 'request', 'requests', 'response', 'responses'],
    ['JSON', '程序之间传数据用的一种简单文本格式，像一份标了名字的清单。', 'JSON'],
    ['REST', '做接口的一种常见写法：每个网址代表一类东西（订单、商品）。', '=REST', '=RESTful'],
    ['请求方法', '请求的种类：GET 是读取，POST 是新建，PUT 或 PATCH 是修改，DELETE 是删除。', 'HTTP method', 'HTTP methods', '=GET', '=POST', '=PUT', '=PATCH', '=DELETE'],
    ['HTTP', '浏览器和服务器在网上说话用的语言；HTTPS 是加密的那种。', 'HTTP', 'HTTPS'],
    ['CDN', '散布在各地的一批服务器，从离访客近的地方把图片和文件传过去。', 'CDN', 'CDNs'],
    ['云上的文件柜', '放商品图、上传文件、导出表格这类东西的云存储。', 'storage bucket', 'bucket', 'buckets', 'S3', 'GCS', 'Cloud Storage'],
    ['Pub/Sub', 'Google 的消息服务：应用的一块发出一件事，别的块在后台接过去处理。', 'Pub/Sub', 'PubSub'],
    ['MCP', '把 AI 助手（比如 Claude 或 ChatGPT）接到应用上的一种标准办法，让它们能来查东西。', 'MCP', 'MCP server', 'Model Context Protocol'],
    ['Next.js', '用 React 做网站和网页应用的一套常用工具。', 'Next.js', 'NextJS'],
    ['React', '用可复用的小块来做能互动的页面的一套常用工具。', '=React'],
    ['Flask', '用 Python 做网站服务器的一套工具。', 'Flask'],
    ['SQLAlchemy', '一套 Python 工具，让代码读写数据库记录时不用手写数据库命令。', 'SQLAlchemy'],
    ['Postgres', '一种用得很广的数据库；RDS 和 Cloud SQL 是亚马逊和 Google 托管的版本。', 'Postgres', 'PostgreSQL', 'RDS', 'Cloud SQL'],
    ['Docker', '把应用和它需要的一切打包在一起，换台电脑或换到云上都一样能跑。', 'Docker', 'container', 'containers'],
    ['Cloud Run', 'Google 的服务：在云上跑应用的服务器和后台任务，不用自己管机器。', 'Cloud Run'],
    ['中间检查', '每个请求进来时都要过的一道检查，比如「这个人登录了吗」。', 'middleware'],
    ['一组请求（Blueprint）', '在 Flask 里，把相关的请求捆在一起，比如所有订单请求。', 'blueprint', 'blueprints'],
    ['测试', '自动检查代码还正不正常，改动上线之前先跑。', 'test suite', 'unit test', 'unit tests', 'pytest', 'Vitest'],
    ['脚本', '人手动跑一次的小程序，用来做一次性的事，比如修正或导入数据。', 'script', 'scripts'],
    ['OAuth', '「用某某登录」按钮背后的标准：让一个应用替你用另一个，又不用交出密码。', 'OAuth'],
  ];

  const exact = new Map(), loose = new Map(), alts = [];
  TERMS.forEach(([name, text, ...aliases], i) => {
    for (let a of aliases) {
      const strict = a.startsWith('=');
      if (strict) a = a.slice(1);
      (strict ? exact : loose).set(strict ? a : a.toLowerCase(), i);
      alts.push(a);
    }
  });
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  alts.sort((a, b) => b.length - a.length);
  const RE = new RegExp(`(?<![\\w./-])(?:${alts.map(esc).join('|')})(?![\\w/]|-\\w|\\.\\w)`, 'gi');
  const termOf = (m) => exact.has(m) ? exact.get(m) : loose.has(m.toLowerCase()) ? loose.get(m.toLowerCase()) : -1;

  // Where to look, and what to leave alone.
  const TARGETS = '.pd, .rd, .callout';
  const SKIP = 'a[href], button, code, pre, kbd, samp, input, textarea, select, [contenteditable], .tag, .rp, .pp, .method, .kbd, .sc-term, [data-noglossary]';
  const CLICKABLE = 'a, [data-go], [data-sel], [data-flow], [data-open], [role="button"]';
  const isMono = (el) => /mono|monospace/i.test(el.style?.fontFamily || '');

  function annotate(scope, targets) {
    if (!scope || SC.technical()) return;
    const used = new Set([...scope.querySelectorAll('.sc-term')].map((s) => +s.dataset.term)); // max one per term per scope
    const skipped = (from, stop) => { for (let p = from; p && p !== stop; p = p.parentElement) if (p.matches(SKIP) || isMono(p)) return true; return false; };
    for (const el of targets) {
      if (skipped(el, scope)) continue;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (t) => !t.nodeValue.trim() || skipped(t.parentElement, el) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      for (const t of texts) wrapIn(t, used);
    }
  }
  function wrapIn(textNode, used) {
    let node = textNode;
    while (node) {
      RE.lastIndex = 0;
      let m, hit = null;
      while ((m = RE.exec(node.nodeValue))) {
        const i = termOf(m[0]);
        if (i >= 0 && !used.has(i)) { hit = { m, i }; break; }
      }
      if (!hit) return;
      used.add(hit.i);
      const word = node.splitText(hit.m.index);
      const rest = word.splitText(hit.m[0].length);
      const span = document.createElement('span');
      span.className = 'sc-term';
      span.dataset.term = String(hit.i);
      if (!word.parentElement.closest(CLICKABLE)) span.tabIndex = 0; // inside clickable rows: hover only, clicks pass through
      word.replaceWith(span);
      span.appendChild(word);
      node = rest;
    }
  }
  function strip(scope) {
    if (!scope) return;
    for (const s of scope.querySelectorAll('.sc-term')) s.replaceWith(...s.childNodes);
    scope.normalize();
  }

  const panelEl = () => document.getElementById('panel');
  const contextEl = () => document.getElementById('context');
  const doPanel = () => { const p = panelEl(); if (p) annotate(p, p.querySelectorAll(TARGETS)); };
  const doContext = () => { const c = contextEl(); if (c) annotate(c, c.querySelectorAll('p, .callout')); };

  // Run after the viewer and any other extension listeners have finished filling the DOM.
  SC.on('panel', () => { hide(true); queueMicrotask(doPanel); });
  SC.on('render', () => { hide(true); queueMicrotask(doContext); });
  SC.on('technical', (on) => {
    hide(true);
    if (on) { strip(panelEl()); strip(contextEl()); }
    else { queueMicrotask(() => { strip(panelEl()); strip(contextEl()); doPanel(); doContext(); }); }
  });

  // ---------- popover ----------
  const style = document.createElement('style');
  style.textContent = `
.sc-term { pointer-events: auto; cursor: help; border-radius: 4px; text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 1px; text-underline-offset: 3px;
  text-decoration-color: rgba(var(--ink), .32); text-decoration-color: color-mix(in srgb, currentColor 45%, transparent); transition: text-decoration-color .2s var(--ease), color .2s var(--ease); }
.sc-term:hover, .sc-term.on { text-decoration-color: currentColor; color: var(--text); }
.callout .sc-term:hover, .callout .sc-term.on { color: inherit; }
.sc-term:focus { outline: none; }
.sc-term:focus-visible { box-shadow: 0 0 0 2px var(--focus); }
#sc-gloss { position: fixed; left: 0; top: 0; z-index: 55; max-width: 280px; padding: 11px 13px; border-radius: 14px; font-size: 12.5px; line-height: 1.5; color: var(--text-2);
  pointer-events: none; opacity: 0; transform: translateY(3px); transition: opacity .15s var(--ease), transform .25s var(--ease); }
#sc-gloss.on { opacity: 1; transform: none; }
#sc-gloss b { display: block; color: var(--text); font-weight: 600; margin-bottom: 2px; }`;
  document.head.appendChild(style);

  const pop = document.createElement('div');
  pop.id = 'sc-gloss';
  pop.className = 'glass';
  pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);

  let current = null, showT = 0, hideT = 0;
  function show(el) {
    clearTimeout(hideT);
    if (current === el) return;
    const term = TERMS[+el.dataset.term];
    if (!term) return;
    current?.classList.remove('on'); current?.removeAttribute('aria-describedby');
    current = el;
    el.classList.add('on');
    el.setAttribute('aria-describedby', 'sc-gloss');
    pop.innerHTML = `<b>${SC.h(term[0])}</b>${SC.h(term[1])}`;
    const r = el.getClientRects()[0] || el.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 8;
    const x = Math.max(12, Math.min(r.left, innerWidth - pw - 12));
    const below = r.bottom + gap + ph <= innerHeight - 12;
    const y = below ? r.bottom + gap : Math.max(12, r.top - gap - ph);
    pop.style.left = `${Math.round(x)}px`;
    pop.style.top = `${Math.round(y)}px`;
    pop.classList.add('on');
  }
  function hide(now) {
    clearTimeout(showT); clearTimeout(hideT);
    const go = () => { pop.classList.remove('on'); current?.classList.remove('on'); current?.removeAttribute('aria-describedby'); current = null; };
    if (now === true) go(); else hideT = setTimeout(go, 90);
  }
  const termAt = (ev) => ev.target instanceof Element ? ev.target.closest('.sc-term') : null;
  document.addEventListener('mouseover', (ev) => { const t = termAt(ev); if (!t) return; clearTimeout(showT); showT = setTimeout(() => show(t), current ? 0 : 140); });
  document.addEventListener('mouseout', (ev) => { const t = termAt(ev); if (t && !t.contains(ev.relatedTarget)) { clearTimeout(showT); hide(); } });
  document.addEventListener('focusin', (ev) => { const t = termAt(ev); if (t) show(t); });
  document.addEventListener('focusout', (ev) => { if (termAt(ev)) hide(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && current) hide(true); });
  document.addEventListener('scroll', () => { if (current) hide(true); }, true);
  addEventListener('resize', () => { if (current) hide(true); });

  // initial pass, in case the first render/panel happened before this script ran
  if (document.readyState !== 'loading') queueMicrotask(() => { doPanel(); doContext(); });
})();
