# 项目里有什么

Floorplan 在你的项目里只写两个地方：`floorplan/` 文件夹，以及（在 Claude Code 里，只有你点头）`CLAUDE.local.md` 里的一小段。这两样都不会提交进 git，项目里的其他东西一概不动。用[无人值守模式](unattended.md)跑（从自动检查或你自己的脚本），它只写 `floorplan/` 文件夹。

## `floorplan/` 文件夹

| 文件 | 它是什么 | 能改吗 |
|---|---|---|
| `index.html` | 地图：一个自包含的页面 | 不能。每次都重建 |
| `graph.json` | 地图上显示的一切，做成数据 | 不能。每次都重建 |
| `architecture.json` | 你的应用有哪些块、外面的服务、额外的连线、流程和导览 | **能** |
| `descriptions/*.json` | 每个文件和每个接口的名字和说明，一块一个文件 | **能** |
| `plan.json` | 只有规划蓝图才有：计划中的文件、接口和页面，谁可以用每个接口，技术组合、假定和还没定的问题。名字和说明写在这里，不写在 `descriptions/` | **能** |
| `recent-work.json` | 刚做了什么，以及为什么。每次更新都换掉 | 很少改。AI 来写 |
| `custom-flows.json` | 从地图上请来的流程 | 只为了删掉一条 |
| `health-dismissed.json` | 你标成 **不是问题** 的健康检查项，以及你的理由 | 只为了撤掉一条。地图上的 **再显示** 也是这个 |
| `serve.mjs` | 在本地提供地图，并通过 Claude Code 命令行或 Codex 回答问题 | 不能 |
| `query.mjs` | 从命令行在地图里查东西；Claude 和 Codex 也用它 | 不能 |
| `page-safety.mjs` | `serve.mjs` 怎么把数据放进它提供和导出的页面，以及那些页面的内容安全策略 | 不能 |
| `artifact.html` | 给 Claude 应用打开的一份副本，只有你要过才有 | 不能 |
| `<项目名>-map.html` | 一份用来分享的导出副本，只有你从 Claude 或 Codex 导出过才有（地图上的导出按钮是直接下载，不放在这里） | 不能 |
| `.cache/` | 扫描结果、说明工作表、上次更新的变化、正在跑的服务器地址；规划蓝图还有计划的最近 20 个版本，**撤销** 靠它们往回走 | 不能。删掉是安全的，但删了之后撤销就没有可回的版本了 |
| `.gitignore` | 让整个文件夹躲开 git | 不能 |

### 改名字和结构

你对 `architecture.json` 和 `descriptions/` 的修改，每次更新都会留着。你可以：

- 给一块改名，或改写一段说明；
- 改 `paths` 里的匹配模式，把文件从一块挪到另一块；
- 补上一条扫描没看见的连线；
- 给一个文件钉一条备注；
- 加或改流程和导览。

或者直接跟 Claude 或 Codex 说（「把 floorplan 上的『主服务器』改成『商店接口』」）。

规划蓝图也是这么改：通过 `plan.json` 和 `architecture.json`，或在地图上用提问栏的 **改规划** 开关。计划的格式在 [`blueprint.md`](../skills/floorplan/references/blueprint.md)。

完整格式在 [`skills/floorplan/references/schema.md`](../skills/floorplan/references/schema.md)。名字和说明的写法在 [`writing-descriptions.md`](../skills/floorplan/references/writing-descriptions.md)。那份指南里的 "Plain language"、"Say what it does today"、"Jargon → plain" 仍是英文标题，是程序和测试认的固定字。

## `CLAUDE.local.md`

在 Claude Code 里，第一张地图做好之后，Claude 会问：以后在这个项目里的对话要不要用它。只有你说要，Floorplan 才在这里加一小段标好的文字，告诉以后的 Claude Code 对话地图在哪、怎么在里面查东西。`CLAUDE.local.md` 是 Claude Code 放个人项目笔记的文件，和 `CLAUDE.md` 一样，每轮对话开始时都会加载。Floorplan：

- 你还没有这个文件，就建一个；
- 永远只改写它自己的那一段，在 `<!-- floorplan:start -->` 和 `<!-- floorplan:end -->` 之间，并在每次更新时保持它是新的；
- 把这个文件加进你这份克隆的私人忽略名单 `.git/info/exclude`。

要去掉，删掉那一段。要它不要再回来，在 `CLAUDE.local.md` 的任意位置放上 `<!-- floorplan:off -->`。（0.4.4 之前，Floorplan 不问就加这段；如果你是从那时留下来的，它会一直在，直到你删掉。）

规划蓝图不加这段，因为还没有代码可查。地图换成真实代码之后，Claude 会再问一次。

在 Codex 里这个文件不动。Codex 没有私人的、不提交的笔记文件（`AGENTS.md` 是跟团队共享的），所以 Floorplan 不在那里加笔记。

<a id="staying-out-of-git"></a>

## 躲开 git

- **`floorplan/`** 自己带一份 `.gitignore`，忽略文件夹里的一切，包括这份忽略文件自己。你的 `.gitignore` 不会被改，这个文件夹也从不出现在 `git status` 里。
- **`CLAUDE.local.md`** 写在 `.git/info/exclude` 里。那是每一份克隆自己的忽略名单，从不提交。你的项目本来就忽略它的话，什么都不会再加。

地图是每一份克隆自己的。装了 Floorplan 的队友会做出他们自己的。

如果你以前把 `floorplan/` 文件夹提交过，现在忽略它并不会把那些文件从跟踪里拿掉。构建会告诉你该跑哪条命令。这条命令只取消跟踪，磁盘上的文件还在：

```bash
git rm -r --cached floorplan
```
