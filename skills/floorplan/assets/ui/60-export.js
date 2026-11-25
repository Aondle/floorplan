// Export: a copy of the map to share as one HTML file, for people without Claude or Codex. The map's server
// (serve.mjs) builds it: the same page without the Ask bar, requests for Claude or Codex, or links into this
// computer, plus the extras ticked here. Talks to the viewer only through window.Floorplan.
(() => {
  const SC = window.Floorplan;
  if (!SC || SC.exported) return;
  const S = window.FLOORPLAN_SERVER;
  // opened in the Claude app: there's no map folder to export from
  if (!S && location.protocol !== 'file:') return;
  const { h } = SC;
  const G = SC.graph;
  const PLAN = !!G.meta.blueprint;
  const CMD = 'node floorplan/serve.mjs --export';

  const style = document.createElement('style');
  style.textContent = `
.xp-opts { display: flex; flex-direction: column; gap: 2px; margin: 14px 0 4px; }
.xp-opt { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
.xp-opt:hover { background: rgba(var(--ink), .05); }
.xp-opt input { margin: 3px 0 0; width: 16px; height: 16px; accent-color: var(--accent); flex: none; cursor: pointer; }
.xp-opt b { display: block; font-weight: 500; color: var(--text); }
.xp-opt span { display: block; font-size: 12.5px; color: var(--text-3); line-height: 1.5; }
.xp-opt.warn span { color: var(--warn-text); }
.xp-note { font-size: 12.5px; color: var(--text-3); line-height: 1.55; margin-top: 10px; }
.xp-err { font-size: 12.5px; color: var(--warn-text); background: var(--warn-bg); border-radius: 10px; padding: 8px 12px; margin-top: 10px; }
`;
  document.head.appendChild(style);
  SC.icons.export = '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>';

  // only what this map has; the extras that say how the app could be attacked are off unless ticked
  const PARTS = [
    { id: 'flows', label: '流程和导览', hint: '一步一步的讲解，包括你请助手串起来的。', on: true, has: G.flows.length > 0 || (G.tour || []).length > 0 },
    { id: 'notes', label: '钉在文件上的备注', hint: '文件卡片上的那些备注。', on: true, has: G.files.some((f) => f.note) },
    { id: 'recent', label: '最近改动', hint: '刚改了什么，以及为什么。', on: false, has: !!G.recent?.items?.length },
    PLAN
      ? { id: 'health', label: '设计审查', hint: '规划里还没定下来的那些决定。', on: false, has: !!G.health?.issues?.length }
      : { id: 'health', label: '健康检查', hint: '会列出谁都能用的接口，以及密钥写在代码的哪一行（绝不是密钥本身）。只发给你信得过的人。', on: false, warn: true, has: !!G.health?.issues?.length },
  ].filter((p) => p.has);

  async function download(el, close) {
    const err = el.querySelector('.xp-err');
    const include = [...el.querySelectorAll('[data-xp]')].filter((c) => c.checked).map((c) => c.dataset.xp);
    // flows requested since the map was last built live only on this page so far
    const flows = G.flows.filter((f) => f.custom).map((f) => ({ id: f.id, title: f.title, description: f.description, steps: f.steps }));
    try {
      const r = await fetch('/api/export', { method: 'POST', headers: { 'content-type': 'application/json', 'x-floorplan-token': S.token }, body: JSON.stringify({ include, flows }) });
      if (r.status === 403) throw new Error('这页打开之后，地图的服务器重启过。刷新页面再试。');
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || '地图的服务器没能导出。');
      const name = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') || '')?.[1] || 'floorplan-map.html';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await r.blob());
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      close();
      SC.toast(`已下载 ${name}`);
    } catch (e) {
      err.hidden = false;
      err.textContent = e.message === 'Failed to fetch' ? '连不上地图的服务器。让 Claude 或 Codex 再打开一次 floorplan，然后再试。' : e.message;
    }
  }

  function openExport() {
    if (!S) {
      SC.modal({
        title: '导出一份',
        html: `<p>导出需要地图的服务器。让 Claude 或 Codex「导出 floorplan」，或者在项目文件夹里运行：</p><pre>${h(CMD)}</pre>`,
        actions: [{ label: '复制命令', primary: true, icon: 'copy', onClick: () => { SC.copy(CMD).then((ok) => { if (ok) SC.toast('已复制'); }); } }],
      });
      return;
    }
    const m = SC.modal({
      title: '导出一份',
      html: `<p>一个 HTML 文件，整张地图都在里面，发给谁都能打开。任何浏览器都能看，不用安装，也没有提问栏。</p>
        ${PARTS.length ? `<div class="xp-opts">${PARTS.map((p) => `<label class="xp-opt${p.warn ? ' warn' : ''}"><input type="checkbox" data-xp="${p.id}"${p.on ? ' checked' : ''}><div><b>${h(p.label)}</b><span>${h(p.hint)}</span></div></label>`).join('')}</div>` : ''}
        <p class="xp-note">能看出 ${h(G.project.name)} 是怎么拼起来的：每一块、每个文件、每条接口，以及里面函数的名字，但没有代码本身。</p>
        <div class="xp-err" hidden></div>`,
      actions: [{ label: '下载', primary: true, icon: 'export', keepOpen: true, onClick: (close) => { download(m.el, close); } }],
    });
  }

  SC.addHeaderButton({ id: 'btn-export', label: '导出', icon: 'export', title: '导出一份地图，发给别人看', onClick: openExport });
})();
