# 不在对话里跑 Floorplan

Floorplan 是做来在 Claude Code 或 Codex 里跑的，你在旁边。它也可以自己跑：在自动检查（CI，每次提交后自动跑的那套）里、在脚本里，或从你自己的工具，用任何能读文件并返回 JSON 的模型。这份指南讲让这件事成立的三样东西：

- **无人值守模式**，把 Floorplan 限制在它自己的文件夹里，并让失败真的失败；
- **`--json`**，把每个脚本的结果做成数据，而不是一篇报告；
- **工作流文件** `skills/floorplan/workflow.json`，把每一步写成数据，好让一个小程序跟着走。

脚本在这里、在别处，都从不调用模型。它们干一切机械的事。模型只会写出三种 JSON 文件：`floorplan/architecture.json`、`floorplan/descriptions/<key>.json` 和 `floorplan/recent-work.json`。在对话里，是助手来写；没有对话时，你的程序去问模型，再把答案写下来。

## 无人值守模式

用一个环境变量打开：

```bash
export FLOORPLAN_UNATTENDED=1
```

（Windows PowerShell：`$env:FLOORPLAN_UNATTENDED = "1"`），或给脚本传 `--unattended`。这会给它自己、以及它再去跑的脚本设上同一件事（`refresh.mjs` 会跑 `scan.mjs` 和 `build.mjs`）。无人值守模式下：

- **`floorplan/` 以外什么都不写。** 没有 `CLAUDE.local.md`，不往 `.git/info/exclude` 加行，不把旧的 Floorplan 段落从 `CLAUDE.md` 里挪走，旧的 `show-code/` 地图留在原地。Git 带着 `--no-optional-locks` 跑，所以连 `git status` 也不动仓库自己的文件。
- **地图不点名任何助手。** 它记下 `"agent": "none"`，所以按钮说「让 AI 来改」（规划蓝图上是「让 AI 来处理」），贴进去的对象是「你的 AI 编程助手」，而不点 Claude 或 Codex 的名。你也可以单独设 `FLOORPLAN_AGENT=none`。点名一个助手（`--agent claude`、`FLOORPLAN_AGENT=codex`）仍然优先。地图的服务器如果在跑，它会点出自己找到的命令行，跟一直以来一样。
- **`open.mjs` 什么都不启动。** 旁边没有人看，所以它不启动服务器，也不打开浏览器。
- **失败就是失败。** 见[退出码](#exit-codes)。

别的都一样：扫描、地图、健康检查、说明。不开无人值守模式，Floorplan 的行为没有任何变化。

### git 列不出一个仓库的文件时

扫描用 `git ls-files` 找文件。如果没装 git，或因为文件夹的主人是另一个用户而拒绝这份检出（"dubious ownership"，容器里很常见），那个仓库以前会一声不吭地什么都不加进地图。现在扫描会说出来，对谁都说。打印出来的仍是英文，例如：

```
! PROBLEMS (1): the map will be missing files until these are fixed
  ! shop-web adds no files to the map: git refuses this checkout because a different user owns the folder ("dubious ownership"), which is common in containers. Mark it safe, then scan again: git config --global --add safe.directory "/work/shop-web"
```

`PROBLEMS` 和这几句是程序里的固定字。意思是：地图会缺文件，直到这些修好；`shop-web` 一个文件都加不进来，因为另一个用户拥有这个文件夹，git 拒绝了（容器里常见）。把它标成安全的再扫一次，命令就写在那一行里。

无人值守模式下，这变成错误：扫描以退出码 1 结束，什么都不写，并点出仓库和大概的改法。一个文件都找不到，在那里也是错误。

## 结果用 JSON

`scan.mjs`、`build.mjs`、`describe.mjs`、`refresh.mjs`、`recent.mjs` 和 `status.mjs` 接受 `--json`。带上它，脚本在标准输出上恰好打印一个 JSON 对象，那里没有别的。给人看的东西去标准错误。

每个对象都有：

- `schema`：它是什么，例如 `"floorplan/build-result@1"`；
- `ok`：成没成；
- 没成时有 `errors`（一列消息）。

大多数还带着给人读的报告原文（`report`、`summary` 或 `text`）。模型有东西要修时，需要看到的就是这个。路径相对于代码库根，用正斜杠。`--json` 和 `--unattended` 从不带值，所以 `--json /path/to/project` 是对的。

### scan.mjs：`floorplan/scan-result@1`

| 字段 | 它是什么 |
|---|---|
| `repos[]` | `path`、`name`、`branch`、`head`、`files`，以及 `listed`：git 列不出来时为 false |
| `counts` | `files`、`outsideRepos`、`byCategory`（code、config、docs……）、`notMapped`（地图不会显示的每一类文件：`architecture.json` 的 `include` 留在外面的，或还没写 `include` 时除了代码以外的全部）、`code`（{ files, loc }）、`byLanguage`、`routes`、`httpMatches`、`importEdges`、`autoImportLinks`（没用 import 就用到的 Nuxt 组件和组合函数）、`wayfinderLinks`（对上了接口的 Laravel Wayfinder 调用）、`inertiaPages`（连到打开它们的接口的 Inertia 页面）、`unresolvedImports`、`externalPackages`、`notRead` |
| `problems[]` | `{ code, message }`：`git_failed`（带 `repo` 和 git 自己的 `error`）或 `no_files` |
| `warnings[]` | 这些问题的消息，在它们还不是错误的时候 |
| `summary` | 模型用来画地图的摘要：和扫描打印出来的是同一段文字 |
| `scanFile` | 扫描存到了哪（`floorplan/.cache/scan.json`） |

### build.mjs：`floorplan/build-result@1`

| 字段 | 它是什么 |
|---|---|
| `errors[]`、`warnings[]` | 构建在 architecture.json 或说明里发现的所有问题，用它打印出来的原话 |
| `files` | `total`、`unassigned`、`unassignedPercent`（一位小数）、`include` |
| `notMapped` | `byCategory`：`include` 留在地图外的每一类有多少文件，大的在前，例如 `{ "docs": 52, "config": 38, "asset": 140 }`；`ignored`：本该算进去、却被 `ignore` 留在外面的文件。报告在它的 `NOT MAPPED` 那一行说同一件事。`NOT MAPPED` 是固定英文 |
| `unassignedByDirectory[]` | `{ dir, files }`，大的在前 |
| `nodes[]` | 最顶上的那些块：`id`、`kind`、`files`、`loc` |
| `links` | `total` 和 `byKind`（import、http……） |
| `descriptions` | `files` 和 `routes` 是 `{ described, total }`，`modules` 是 { withSummary, total, missing }，`review` 是仍被标出来要复查的条目，`complete`：每个文件和接口都有说明，而且没有剩下要复查的 |
| `plainLanguage` | 给所有人看的地图上，节点标签和摘要里的开发者用词：`checked`（`audience` 是 `developers` 时为 false）、`count`（有这种词的块数）和 `items[]`（{ node, field: `label` 或 `summary`, term, say }）。每一块还会在 `warnings[]` 里得到一行以 `plain language:` 开头的提醒。这几个英文词是固定的。从不是错误 |
| `partsToSplit[]` | 没有子块、文件超过 24 个、而且这些文件待在各自好几个文件夹里的块：`{ id, files, folders: [{ dir, files }] }`，也在 `warnings[]` 里 |
| `secretsHidden[]` | 每一段看起来含着密钥、因而在地图里写成 «hidden» 的文字，是 `{ file, field }`，例如 `{ "file": "descriptions/api.json", "field": "files[\"api/server.js\"].description" }`。绝不是那个值。每个文件还会在 `warnings[]` 最上面得到一行 `secret-looking text in …`（固定英文）。这是警告，从不是错误；文件本身保持原样 |
| `health` | `kind`（`health`，规划蓝图是 `design-review`）、`high`、`medium`、`low`，以及 `important[]`（{ severity, kind, title }），还有 `checked[]`（{ check, label, checked, text, loud? }）：每一项检查一条（`endpoints`、`supabase`、`firebase`、`stripe`、`secrets`），说明它读了什么，或没什么可读；`loud` 标出要紧的缺口，比如代码在跑服务器却没找到接口。没有时是 `null` |
| `screens` | 找到了多少个页面 |
| `recentWork` | 标出来的 `cards` 和 `tasks`，以及 `recent-work.json` 在不在 |
| `agent`、`audience`、`blueprint`、`unattended`、`check` | 它是怎么构建的 |
| `notes` | `claudeLocalMd`：`CLAUDE.local.md` 发生了什么，如果有的话（无人值守模式下永远什么都没有）；`git`：git 已经在跟踪 `floorplan/` 里的文件时的一条警告 |
| `wrote[]` | 写进地图文件夹的文件；有错误时，或带了 `--check` 时，是空的 |
| `report` | 构建的报告 |

报告里这几个标题是固定英文，不要当成可以改的文案：**HEALTH**、**DESIGN REVIEW**、**what was checked:**，以及 **ASSIGNMENT**。

构建停在它没料到的事上时（比如一个写不了的文件），它仍然打印一个对象并以退出码 1 结束：`ok` 是 false，`errors` 里有一行，像 `build stopped unexpectedly (EACCES); see stderr`，还有 `warnings`（空的）和 `report`，没有其他字段。细节只在标准错误上，因为它们可能引用你的文件。

### describe.mjs：`floorplan/describe-result@1`

| 字段 | 它是什么 |
|---|---|
| `nothingToDo` | 每个文件和接口都已经有说明时为 true（仍然 `ok`，退出码 0） |
| `worksheets[]` | 一张工作表一条：`key`、`node`（它的标签）、`nodeId`、大块被拆开时的 `part` 和 `parts`、`files`、`routes`、`loc`、`worksheet`（工作表的路径）和 `descriptions`（要填的那个文件） |
| `totals` | `worksheets`、`files`、`routes` |
| `audience`、`style` | 说明是写给谁的，以及每张工作表开头的那句风格。工作表里的输入名仍是英文，例如 Scan summary、Worksheet；那句固定英文是 `Say what it does today` |

### refresh.mjs：`floorplan/refresh-result@1`

| 字段 | 它是什么 |
|---|---|
| `map` | 没有地图可刷新时为 false |
| `changes` | `files`（{ new, deleted, moved, edited, digestChanged }）、`routes`（{ new, removed, repathed }）、`descriptions`（{ carried, removed, flagged }）、`large`，以及 `fingerprints`（地图太旧、没法比较编辑时为 false） |
| `newFilesByDirectory[]` | `{ dir, files }` |
| `build` | 构建自己的 `--json` 结果，完整的一份 |
| `next[]` | 还要做的事，按顺序，每一项是 `{ code, text }` 再加细节 |
| `report` | 这次刷新的报告 |

NEXT 的 `code` 是稳定的，程序可以照着行动：

| 代码 | 意思 | 细节 |
|---|---|---|
| `fix_build` | 构建失败了；去修 architecture.json | `errors` |
| `assign_new_files` | 文件落在每一块的外面；加上通配路径或一块 | `directories` |
| `describe` | 跑 describe.mjs，把列出的填上 | `missing`（{ files, routes }）、`review` |
| `review_structure` | 改动很大；看一眼摘要和流程 | |
| `recent_work` | 永远在最后：标出最近改动 | |
| `first_map` | 还没有地图；去做一张 | |
| `fix_scan` | 扫描停了（只在无人值守模式）；看 `errors` | |
| `fix_plan`、`blueprint` | 只有规划蓝图（见[它怎么干活](how-it-works.md#blueprints)） | |

### recent.mjs：`floorplan/recent-result@1`

`changedSinceMap`（上一张地图之后新的、改过的、移动的和删掉的文件与接口，或 `null`）、`since`、`current`（现在这份 recent-work.json），以及 `repos[]`，里面有 `uncommitted[]`（`status`、`path`）和 `commits[]`（`hash`、`date`、`subject`、`files[]`）。每条路径都带着它在地图上显示成的 `card`（`name`、`node`、`nodeLabel`、`endpoints`），不在地图上时是 `null`。什么都没有时 `nothingRecent` 为 true，`text` 是模型读的那份报告。

### status.mjs：`floorplan/status-result@1`

`state` 是 `none`、`unbuilt`（有 architecture.json 但没有地图）、`map`、`blueprint`、`blueprint-started` 或 `unknown`（地图读不了）。这些状态名保持英文。有地图时：`builtAt`、`files`、`nodes`、`agent`，以及 `repos[]`，里面有 `sameCommit`、`changedFiles` 和 `uncommitted`（没有可比较的提交时是 `compared: false`）。`status.mjs` 从不失败。

<a id="exit-codes"></a>

## 退出码

`0` 表示这一步成了，包括没什么可做的时候（JSON 会说：`nothingToDo`、`nothingRecent`）。别的都表示失败了。

| 脚本 | 没有无人值守模式 | 无人值守模式下 |
|---|---|---|
| `scan.mjs` | 只有崩溃才是 1；git 的问题会报告，不算失败 | git 列不出一个仓库，或一个文件都找不到，也是 1 |
| `build.mjs` | 有错误，或没有扫描、没有 architecture.json，是 1 | 一样 |
| `describe.mjs` | 没有地图是 1；没什么可描述时是 0 | 一样 |
| `refresh.mjs` | 是 0，哪怕没有地图或构建失败（NEXT 列表说下一步做什么） | 没有地图、扫描失败或构建失败时是 1 |
| `recent.mjs` | 没有地图是 1 | 一样 |
| `status.mjs` | 永远是 0 | 一样 |

`--json` 只改变打印出来的东西，从不改变退出码。

<a id="the-workflow-file"></a>

## 工作流文件

`skills/floorplan/workflow.json`（`"schema": "floorplan/workflow@1"`）是 SKILL.md 的过程做成的数据：一个程序做一张地图、或把一张地图更新到最新，所需要的一切，换任何模型都行。它有：

- **`conventions`**：怎么跑一个脚本、退出码是什么意思、结果怎么保存和读取、答案怎么检查和写下，以及模型拿到的四种工具：`read_file`、`list_files`、`grep`（都是只读，在代码库里面）和 `submit`（它的答案）。
- **`format`**：每一种步骤是什么意思。一步可以跑一个脚本、跑一个模型作业（一次，或每一项一次，可以并行）、写一个固定的文件、重复一些步骤直到一项检查通过（给了 `minAttempts` 时至少那么多次），或跟着刷新的 NEXT 列表走。标了 `optional: true` 的作业或重复步骤可以失败而不让整次运行失败：驱动把 `restore` 名单里的文件放回原样，跑它的 `onFail` 步骤，在这次运行的笔记里记下 `{ step, reason }`，然后继续。带 `onlyChange: { file, fields }` 的作业只能改那个文件的那些字段（`nodes[].label` 表示每个节点的标签）；任何别的差别都像不符合结构一样退回给模型。
- **`start`**：跑 `status.mjs --json`，然后选 `first_map` 或 `refresh`。
- **`workflows`** 和 **`procedures`**：步骤。
- **`jobs`**：每种模型工作一个：`architecture`、`plain_language`、`update_architecture`、`descriptions` 和 `recent_work`。每一个列出要给模型的参考文件、它的指示（写给一个只有那些工具、旁边没有人可问的模型）、它的输入、答案变成的文件，以及答案结构的名字。输入名仍是英文，例如 Scan summary、Worksheet。
- **`schemas`**：每种答案的一份 JSON Schema。

这些作业指向 `skills/floorplan/references/` 里的参考文件，而不是把它们再抄一遍，所以格式和文风指南只有一处来源，和 SKILL.md 共用。

### 第一张地图怎么走

1. `scan.mjs --json`。模型拿到它的 `summary`。
2. `architecture` 作业：模型读 `schema.md`、`choosing-boundaries.md` 和 `writing-descriptions.md`，用它的工具在代码里看看，然后交上 architecture.json。接着 `build.mjs --json`。直到 `build.ok` 为 true，并且 `files.unassignedPercent` 低于 10，这个作业会再跑，这一次还拿到它上一份 architecture.json 和构建的 `report`。最多 4 次。然后，如果 `plainLanguage.count` 大于 0，`plain_language` 作业拿到 architecture.json 和那份报告，只改写它的 `plain language:` 提醒点名的那些标签和摘要；驱动拒绝一份还改了别的东西的答案（`onlyChange`），构建再检查它仍然能过。这一步是 `optional`：模型没有给出合法答案，或改写后的文件试了 2 次还构建不干净，驱动就把当初能构建的那份 architecture.json 放回去，重新构建，记一笔，然后继续。那之后还留着的词仍是警告：它们从不让这次运行失败。
3. `describe.mjs --json`，然后每张工作表一个 `descriptions` 作业，你愿意的话并行：模型拿到工作表（里面引用了每个接口的代码，以及很短的文件）和要填的文件，交上填好的。然后构建。这样重复，直到 `descriptions.complete` 为 true（describe.mjs 只列出还缺的）。最多 3 次。
4. `recent.mjs --json`。如果 `nothingRecent`，就写 `{ "tasks": [] }`；否则 `recent_work` 作业把它的 `text` 变成 recent-work.json。没有对话可以接着，所以输入是上次地图之后改了什么、还没提交的改动和最近的提交。然后构建。

### 一次刷新怎么走

`refresh.mjs --json`，然后对 `next` 里的每一项，走它的代码对应的过程：`fix_build` 和 `assign_new_files` 跑 `update_architecture` 作业，直到构建通过它的检查，`describe` 和 `recent_work` 像第一张地图那样跑，以此类推。文件不认识的一个代码会让这次运行失败，所以更新的 Floorplan 不会被静静地只跟着走一半。

### 一个走通的例子

`/work/shop` 里有一个两个仓库的商店：

```bash
export FLOORPLAN_UNATTENDED=1
S=/path/to/floorplan/skills/floorplan

node $S/scripts/status.mjs /work/shop --json      # "state" 是 "none"，所以走 first_map
node $S/scripts/scan.mjs /work/shop --json        # 把 "summary" 交给 architecture 作业
# ... 把模型的答案写到 /work/shop/floorplan/architecture.json ...
node $S/scripts/build.mjs /work/shop --json
```

在 Windows PowerShell 里，前两行是 `$env:FLOORPLAN_UNATTENDED = "1"` 和 `$S = "C:\path\to\floorplan\skills\floorplan"`；`node` 那几行一样。每个 JSON 文件写成 UTF-8；开头有一个字节顺序标记也行（Windows PowerShell 5.1 的 `Set-Content` 和 `Out-File` 会加上）。

构建的回答，节选：

```json
{
  "schema": "floorplan/build-result@1",
  "ok": true,
  "files": { "total": 8, "unassigned": 2, "unassignedPercent": 25, "include": ["code"] },
  "unassignedByDirectory": [{ "dir": "shop-web/src", "files": 2 }],
  "descriptions": { "files": { "described": 0, "total": 8 }, "routes": { "described": 0, "total": 4 }, "complete": false },
  "report": "ASSIGNMENT  8 files (code), 2 unassigned (25.0%)\n  ..."
}
```

25% 超过了限度，所以驱动带着那份 `report` 再跑一次 architecture 作业，再构建一次。然后：

```bash
node $S/scripts/describe.mjs /work/shop --json
```

```json
{
  "schema": "floorplan/describe-result@1",
  "ok": true,
  "nothingToDo": false,
  "worksheets": [
    { "key": "api", "node": "Main server", "files": 6, "routes": 4, "worksheet": "floorplan/.cache/worksheets/api.md", "descriptions": "floorplan/descriptions/api.json" },
    { "key": "web", "node": "Website", "files": 2, "routes": 0, "worksheet": "floorplan/.cache/worksheets/web.md", "descriptions": "floorplan/descriptions/web.json" }
  ]
}
```

两个 `descriptions` 作业，一张工作表一个，各自写下它的 `descriptions` 文件。再构建，直到 `descriptions.complete`，然后是最近改动，地图就是 `floorplan/index.html`。例子里的 `"Main server"` 和 `"Website"` 只是示意；真正的标签按那份指南用中文来写。

[`tests/unattended.test.mjs`](../tests/unattended.test.mjs) 里有一个大约一百行的完整驱动，跟着这个文件走，用准备好的答案代替模型。从那里开始做你自己的，很合适。

### 驱动要负责什么

- 每个模型作业只用文件列出的那些工具，在代码库里面，只读，并且不上网。
- 拿每个答案对它的结构检查（以及它的作业的 `onlyChange`），把问题退回去，并自己写下被接受的答案。模型从不写文件。
- 尊重 `optional` 步骤：失败的一步把它的 `restore` 文件放回去，跑 `onFail`，并记一笔，从不致命。
- 不把密钥写进它写下的东西。模型读代码，密钥也包括在内，所以一个被骗了或粗心的模型会把一把密钥抄进说明。构建在这种文字到达地图之前会打码（见上面的 `secretsHidden`），但答案文件里留着写下的内容。想让它们也干净，写下之前先把每份答案的文字过同一项检查：
  ```js
  import { maskSecrets } from '/path/to/floorplan/skills/floorplan/scripts/lib/health.mjs';
  const safe = maskSecrets(text);        // 人或模型写下的文字
  if (safe !== text) { /* 里面有看起来像密钥的东西：写下 `safe`，或把它当成问题退回去 */ }
  ```
  `maskSecrets(text)` 返回那段文字，其中每个是密钥或可能是密钥的值都换成 `«hidden»`；一个都没有时，返回原文。这是一个稳定的导出，测试盯着。（带上第二个参数 `{ path, lang, category }` 时，它把这段文字当成那个文件的源代码来对待。）
- architecture.json 里的模式（`paths`、`exclude`、`ignore`、`packages`、`hosts`）不合法、超过 300 个字符、通配符多于 12 个或 `{…}` 组多于 8 个，或一份名单里超过 500 个，都是构建错误，并且点名它们（`nodes[3] ("web").paths[0] "[evil" is not a valid pattern: …`），所以它们像别的问题一样退回给模型。
- 限度：时间、费用，以及一个作业可以做多少次工具调用（每个作业建议一个 `toolCalls` 预算）。
- 地图之后怎么办。`floorplan/.cache/` 里有代码的摘要（扫描、工作表，工作表引用了代码的短片段，密钥已打码），所以不要把它公开。`graph.json` 含这台机器的文件夹路径和仓库的远程地址。要分享一张地图，做一份导出，那些会被去掉：`node floorplan/serve.mjs --export [文件] [--include flows,notes,recent,health]`。

## 没覆盖的

- **规划蓝图**，按 PRD 规划的地图，需要有人回答问题，所以工作流文件不做它们。刷新一张已经有的规划蓝图仍然可以。
- **在地图上提问**、请流程，以及在地图上改规划蓝图，需要地图的服务器，以及 Claude Code 或 Codex，跟平时一样。

## 让它一直能用

[`tests/unattended.test.mjs`](../tests/unattended.test.mjs) 跟着 `workflow.json` 跑完整的第一张地图和一次刷新，只用 `--json` 输出和退出码，并检查无人值守模式不往 `floorplan/` 以外写任何东西、地图不点名助手，以及 git 失败会大声失败。你改了 SKILL.md 做地图的方式，就要把 `workflow.json` 改到一致。`refresh.mjs` 里新的一个 NEXT 代码，需要 `workflow.json` 里有一个处理，以及上面那张表里有一行；没有的话测试会失败。
