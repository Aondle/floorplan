// Blueprints: a map planned from a PRD or a description, before any code exists (graph.meta.blueprint,
// from scripts/plan.mjs). Cards get a dashed outline and the project name a "Blueprint" pill, the
// overview says what it was planned from, and every planned part offers "Build this with Claude": a
// ready prompt to build just that part, following the plan. Talks to the viewer only through window.Floorplan.
(() => {
  const SC = window.Floorplan;
  const BP = SC && SC.graph.meta.blueprint;
  if (!BP) return;
  const { h } = SC;
  const A = SC.agent || { name: 'Claude', app: 'Claude Code' };
  const G = SC.graph;

  document.documentElement.classList.add('blueprint');
  const style = document.createElement('style');
  style.textContent = `
    /* planned, not built: a dashed outline on every card */
    html.blueprint .card:not(.connector)::after { content: ""; position: absolute; inset: 0; border-radius: inherit; border: 2.5px dashed rgba(var(--ink), .32); pointer-events: none; }
    .bp-pill { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; margin-left: 8px; border-radius: 999px; font-size: 11px; font-weight: 500; letter-spacing: .02em; color: var(--text-2); border: 1px dashed rgba(var(--ink), .35); flex: none; }
    .bp-list { margin: 8px 0 0; padding-left: 18px; color: var(--text-2); font-size: 13px; line-height: 1.55; }
    .bp-list li + li { margin-top: 4px; }
  `;
  document.head.appendChild(style);

  // a "Blueprint" pill beside the board's title, which is redrawn on every move
  const addPill = () => {
    const k = document.querySelector('#context .k');
    if (!k || k.querySelector('.bp-pill')) return;
    k.insertAdjacentHTML('beforeend', '<span class="bp-pill" title="还没做出来：每张虚线卡片都是这个系统需要的一块。">规划蓝图</span>');
  };
  SC.on('render', addPill);
  SC.on('ready', addPill);

  const ACCESS = { public: '任何人', 'signed-in': '登录了的人', team: '只有运营这个服务的人', webhook: '发来通知的那个服务，而且必须证明是它', internal: '只有我们自己的服务' };
  /** 「给登录了的人用：某店的店长」，还没定时就写成还没定。 */
  const whoMay = (r) => !r.access ? '谁可以用还没定，先问我'
    : `给${r.access === 'signed-in' && r.who ? r.who : ACCESS[r.access] || r.access}用${r.publicBecause ? `，因为${r.publicBecause.replace(/[。．.]$/, '')}` : ''}`;

  SC.addPanelSection('overview', () => ({
    html: `<div class="sec"><h3>规划蓝图</h3>
      <p class="pd">${BP.source ? `依据 <b>${h(BP.source)}</b> 规划的` : '规划出来的'}，还没做出来。每张虚线卡片都是这个系统需要的一块。${SC.exported ? '' : `选一块，点<b>让 ${h(A.name)} 来做</b>就可以开始。`}</p>
      ${BP.stack?.length ? `<div class="tags" style="margin-top:10px">${BP.stack.map((s) => `<span class="tag">${h(s)}</span>`).join('')}</div>` : ''}
      ${BP.assumptions?.length ? `<h3 style="margin-top:14px">假设</h3><ul class="bp-list">${BP.assumptions.map((a) => `<li>${h(a)}</li>`).join('')}</ul>` : ''}
    </div>`,
  }));

  /** The planned files inside an item (a part, a folder or one file). */
  const filesIn = (id) => G.files.filter((f) => id === 'f:' + f.p || SC.chain('f:' + f.p).includes(id));
  function buildPrompt(id) {
    const i = SC.info(id);
    const fl = filesIn(id);
    const paths = new Set(fl.map((f) => 'f:' + f.p));
    const eps = SC.routes.filter((r) => paths.has('f:' + r.f));
    const deps = new Map();
    for (const l of G.links) {
      if (!paths.has(l.a) || paths.has(l.b)) continue;
      const o = SC.info(l.b);
      if (o) deps.set(l.b, `${o.name}${l.b.startsWith('f:') ? ` (${l.b.slice(2)})` : ''}`);
    }
    // open questions from the PRD that touch this part
    const inside = (x) => x === id || paths.has(x) || (x.startsWith('r:') && paths.has('f:' + SC.routes[+x.slice(2)]?.f)) || (SC.exists(x) && SC.chain(x).includes(id));
    const questions = (G.health?.issues || []).filter((q) => q.kind === 'question' && (q.items || []).some(inside)).map((q) => q.title);
    return [
      `按 ${G.project.name} 的规划蓝图，做「${i.name}」：依据 floorplan/plan.json 和 floorplan/architecture.json${BP.source ? `（规划来自 ${BP.source}）` : ''}。`,
      i.desc ? `\n它是干什么的：${i.desc}` : '',
      BP.stack?.length ? `\n技术组合：${BP.stack.join('；')}。` : '',
      `\n要新建的文件：`,
      ...fl.map((f) => `- ${f.p}：${f.name}${f.d ? `。${f.d}` : ''}`),
      eps.length ? `\n要做的接口（方法、路径、谁可以用，都按规划来，不要改）：` : '',
      ...eps.map((r) => `- ${r.m} ${r.p}（${whoMay(r)}）：${r.name}${r.d ? `。${r.d}` : ''}`),
      deps.size ? `\n它依赖：${[...deps.values()].join('；')}。` : '',
      questions.length ? `\n还没定（做依赖这些的部分之前先问我）：\n${questions.map((q) => `- ${q}`).join('\n')}` : '',
      `\n写代码之前，先读 plan.json 里相关的部分，并看它依赖的东西有没有已经存在；有的还没有，就告诉我，并建议先做哪一块。文件路径和名字按规划来。如果规划对这一块看起来不对或不完整，先告诉我，不要自己改规划。做完后跑起来或跑测试，并告诉我怎么试。`,
    ].filter((x) => x !== '').join('\n');
  }

  SC.addPanelSection('item', (id) => {
    if (!id || typeof id !== 'string') return '';
    // an endpoint: who the plan lets use it
    if (id.startsWith('r:')) {
      const r = SC.routes[+id.slice(2)];
      if (!r) return '';
      const who = r.access === 'signed-in' && r.who ? r.who : ACCESS[r.access] || r.access;
      const text = !r.access ? `还没定。${SC.graph.health ? '设计审查里列了这一条。' : ''}` : `${who}。${r.publicBecause ? `故意开放：${r.publicBecause}` : ''}`;
      return `<div class="sec"><h3>谁可以用</h3><p class="pd">${h(text)}</p></div>`;
    }
    const i = SC.info(id);
    if (SC.exported || !i || (i.type === 'node' && i.n.kind === 'external') || !filesIn(id).length) return '';
    return {
      html: `<div class="sec"><h3>动手做</h3><p class="pd">一段现成的请求，让 ${h(A.app)} 按规划把${i.type === 'file' ? '这个文件' : '这一块'}做出来。</p>
        <div class="actions"><button class="btn soft" data-bp-build>${SC.iconI('spark')}让 ${h(A.name)} 来做</button></div></div>`,
      bind: (el) => el.querySelector('[data-bp-build]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const prompt = buildPrompt(id);
        SC.modal({
          title: `让 ${A.name} 来做`,
          html: `<p class="hc-hint">复制这段请求，贴进已经打开你项目文件夹的 <b>${h(A.app)}</b>。</p><pre>${h(prompt)}</pre>`,
          actions: [{ label: '复制这段请求', primary: true, icon: 'copy', onClick: () => { SC.copy(prompt).then((ok) => { if (ok) SC.toast(`已复制。贴进 ${A.app}。`); }); } }],
        });
      }),
    };
  });
})();
