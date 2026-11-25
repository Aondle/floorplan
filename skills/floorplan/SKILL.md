---
name: floorplan
description: "给一个项目画一张能点开的结构地图（一个仓库，或好几个并排放在一起）。每个模块、文件和网页请求都有通俗中文名字和一句话说明，按谁引用了谁、谁请求了谁连起来，可以一层层放大。地图存成项目里单独的 floorplan/index.html。用户想看项目怎么串起来、前端怎么跟后端说话、给新人讲结构、或者更新已经有的地图时都要用，即使用户没说「画图」或 visualize。代码还没写、只有需求说明时也要用：它会画出一张规划蓝图（blueprint），用同一张地图把打算做的东西排出来。"
argument-hint: "[path-to-codebase-root] [--refresh]"
allowed-tools:
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/build.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/describe.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/open.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/plan.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/recent.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/refresh.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/scan.mjs *)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/status.mjs *)
---

# Floorplan

你在项目根目录产出 `floorplan/`：一张新人也能当系统图来读的地图。每张卡片上都是人话名字和一句话说明，真正的路径用小字标在下面。

- **你来写：** `architecture.json`（有哪些大块、小块、流程）和 `descriptions/*.json`（每个文件、每条接口的名字和说明）。
- **脚本生成：** `graph.json` 和 `index.html`。

找仓库、解析引用和接口、把网页请求对上接口、排版和出页面，这些机械的活脚本做。你只做读代码的人才能做的那部分：判断每样东西到底是干什么的，并用大白话说出来。

## 输出语言（必须遵守）

无论目标项目的代码和注释是什么语言，下面这些全部用通俗易懂的简体中文来写、来讲：

- 模块名称（节点的 `label`，文件和接口的 `name`）
- 业务功能描述（`summary`、`description`、流程步骤、导览的标题和讲解）
- 健康检查里由你来写的风险说明和修复建议，以及最近改动的 `note`
- 你最后给用户的汇报

代码路径、变量名、接口 URL、JSON 字段名、命令和参数保持原样，不要翻译。产品名（Stripe、Shopify、Postgres）保持原样。只有用户明确要一张给工程师看的地图（`"audience": "developers"`）才可以出现框架和机制的说法，句子本身仍然用中文。

已有地图： !`node ${CLAUDE_SKILL_DIR}/scripts/status.mjs || true`
参数： $ARGUMENTS

**在 Codex 里**（或者上面两行没被填上的任何助手）：这里每条命令里的 `${CLAUDE_SKILL_DIR}` 就是本技能所在的文件夹，也就是放着这份 SKILL.md 的那个。自己用它的路径。先在项目根目录运行 `node <那个文件夹>/scripts/status.mjs`，看地图有没有；路径和 `--refresh` 从用户的请求里拿。脚本能认出自己跑在 Codex 下，所以地图上的提问栏和「让某某来改」会走 Codex。

## 还没写代码？先画规划蓝图

用户想规划一个还没做的东西（「这是我的需求文档」「我想做一个……的应用」，或一大段系统描述）时，做一张**规划蓝图**：同一张地图，依据文档来排，而不是去扫代码。系统本身还没有代码时走这条路，哪怕文件夹里放着别的东西。代码已经在了，就做普通地图。

1. **读输入。** 一份需求文件、粘贴的消息，或用户指给你的文档。只有根本性的事没说清才问 2 到 3 个问题（谁在用、网页还是手机、要不要登录、钱会不会过手）；否则你自己定，并写成一条假设。
2. **读 [references/blueprint.md](references/blueprint.md)**，再读 [references/schema.md](references/schema.md)，按它写 architecture.json。
3. **写 `floorplan/plan.json`**：计划中的每个文件和每条接口、每个页面会调用什么、每一块用到哪些外部服务和数据、谁可以用每条接口、你的假设和还没定的问题。需求只在对话里时，存成 `docs/prd.md`，并把它当作 `source`，这样地图和以后的提问都能指回去。
4. **写 `floorplan/architecture.json`**，写法和代码地图一样（各个部分；plan.json 点到的服务和数据做成外部节点；需求里的主要使用故事做成 1 到 3 条流程；一条导览），用通配路径盖住计划中的文件。对人说人话，见下面第 4 步。
5. **运行 `node ${CLAUDE_SKILL_DIR}/scripts/plan.mjs <root>`，再运行 build.mjs**（下面第 5 步）。它们报什么就改什么，直到两份都干净。跳过 describe.mjs 和 recent.mjs：名字和说明来自 plan.json。规划蓝图不往 CLAUDE.local.md 里写备注，因为还没有代码可查。
6. **打开它**，用 open.mjs（第 8 步）。
7. **汇报**（代替第 8 步的汇报）：网址；用 3 到 5 行说系统长什么样；你选的技术组合；主要假设；设计审查提出的问题和提醒。告诉用户：每一块都有**让 Claude 来做**（或 Codex），点下去就是一段可以直接拿去只做这一块的请求；提问栏可以切到**改规划**，说「把退款也规划进去」这类话，地图会重画，并标出改了哪里（设计审查的**在地图上处理**会填好这样一段请求，所以没定的问题只要用户回答）；plan.json 和 architecture.json 他们可以自己改，也可以叫你改；这张地图不会进 git。

要改规划蓝图，就改 plan.json 和 architecture.json，再运行 `refresh.mjs`，它会按 plan.json 重画。等代码有了、用户想要一张对着代码的地图，运行 `refresh.mjs <root> --from-code`，然后按更新地图的做法继续。plan.json 留在原地。

## 已经有地图？更新它，不要重做

上面的状态显示已经有地图时，不要从头来。运行：

`node ${CLAUDE_SKILL_DIR}/scripts/refresh.mjs <root>`

它会重新扫描，用内容指纹和上次构建对比，并把簿记做完，不另花模型：

- 文件或接口改名、挪了位置，说明跟着走；
- 删掉的文件，对应条目去掉；
- 导出或接口变了的条目标上 `review`（函数身体内部的修改不算）；
- 重新构建；
- 打印变了什么，以及一份很短的 NEXT 清单。

只做 NEXT 让你做的事：

- 给落进 "unassigned" 的新目录补上通配路径；
- 运行 describe.mjs（第 6 步），它现在只给新增和被标出来的条目出工作表；
- 改动很大时，检查模块说明和流程还对不对。

忙了几小时之后的一次更新，通常只有几条工作表。然后标出最近改动（第 7 步），打开并汇报（第 8 步）。就算什么都没变也要打开：用户要看的就是自己的地图。

## 第一次做（工作流）

项目根目录是用户给的那个参数；没给就是当前目录。它可以是一个仓库，也可以是一个普通文件夹，里面并排放着好几个仓库（前端、后端、基础设施等）。扫描会找到下面每一个 git 仓库，并跳过重复的工作区。

1. **扫描。**
   `node ${CLAUDE_SKILL_DIR}/scripts/scan.mjs <root>`
   它写出 `floorplan/.cache/scan.json`，并打印一份摘要：有哪些仓库、带行数的代码树、入口、最重的目录到目录的引用、跨仓库对上的网页请求和接口、外部包和主机名。根据摘要来工作。不要去读 scan.json，它很大。

2. **读约定。** 读 [references/schema.md](references/schema.md)（architecture.json 的格式）和 [references/choosing-boundaries.md](references/choosing-boundaries.md)（怎么把一个项目切成一张好读的地图）。

3. **够用就停。** 读 README、清单（package.json、pyproject、go.mod、docker-compose、部署配置）和入口，然后每个候选大块只扫 1 到 2 个文件，直到你能用一句话概括它。你要的是系统的形状，不是代码评审。

4. **写 `floorplan/architecture.json`。** 目标是：
   - 顶层 3 到 9 个节点；
   - 每个大的下面 3 到 12 个子节点；
   - 通配路径盖住 90% 以上的代码文件；
   - 代码真正在说话的数据库和第三方服务，做成外部节点；
   - 边只补扫描看不见的（队列、定时任务、别人打过来的通知、地址写在设置里的跨服务调用）；
   - 1 到 3 条流程，讲这个系统主要在干什么；
   - 一条 `tour`：给「新手导览」用的 3 到 8 站讲解（见下）。

   每个节点都要有 `summary`。

   **给谁看。** 打开这张地图的通常是应用的主人，常常是用 AI 做出来、自己不读代码的人。除非用户要一张给开发者看的地图，否则别写 `"audience"`，或写成 `"everyone"`。`project.summary`、每个节点的 `label` 和 `summary`、每个文件和接口的说明，都按 references/writing-descriptions.md 里的 "Plain language" 用大白话写。短标签用「主服务器」，不要写成「商店接口（Flask）」。路径、方法和 URL 已经印在卡片上，说明只要讲它是干什么的。写代码今天真正做的事，不要写名字暗示它该做的事：某一块大部分还是占位时，说明里就这么说（writing-descriptions.md 的 "Say what it does today"）。

   **导览。** 加上 `"tour": [{ "node": "<节点 id 或文件路径>", "title": "…", "note": "…" }]`，顺序按新人该看的来：这是个什么应用、人用的那些端、主服务器、外部服务，最后停在一个重要页面的文件上。标题和讲解用从没读过代码的人也能懂的话。第一条引导流程会自动加在最后，当作「跟着看一次真实请求」。没有导览时，会用节点说明和第一条流程拼一条，所以说明要写好，并且至少有一条流程。

5. **构建并改到通过。**
   `node ${CLAUDE_SKILL_DIR}/scripts/build.mjs <root>`
   它会校验全部内容，并点名每个问题（「你是不是想写……」、按目录没分进去的文件、含糊的通配路径）。改完再构建，直到干净，没分进去的低于大约 10%。有两类提醒值得再过一遍：`plain language:` 点名某个部分的标签或说明用了开发者才懂的词（按它建议的说法改），以及「holds N files and no smaller parts」会列出可以顺着拆开的文件夹。

   **Floorplan 做出来的东西都不提交。** `floorplan/` 自带 `.gitignore`，忽略整个文件夹，所以项目里已跟踪的文件不会被碰。如果 git 已经在跟踪那里的文件，构建会打印 `git rm -r --cached` 那条命令让它们退出跟踪；把命令告诉用户，不要自己跑。

   **给以后的会话留一张便条，而且只有用户想要才留。** 在 Claude Code 里，构建可以在项目的 `CLAUDE.local.md` 里维护一小段带标记的文字。这是 Claude Code 个人的、不提交的项目笔记，会话开始时会像 CLAUDE.md 一样被读进来。这段话告诉以后在这里的 Claude Code：地图在，以及怎么用 `floorplan/query.mjs` 查它，这样它们从地图出发，而不是从零翻代码。因为它会改变以后会话的做法，构建不会自己加上：它会报告 `CLAUDE.LOCAL.MD  not added`，你在汇报（第 8 步）里问一次。只有用户说要，才运行 `node ${CLAUDE_SKILL_DIR}/scripts/build.mjs <root> --claude-md`。这段一旦在了，以后每次构建都会把它保持为最新。构建把 `CLAUDE.local.md` 加进仓库本地忽略列表（`.git/info/exclude`，不是 `.gitignore`），只改写自己的那一段，并且如果旧版本把它放进了 `CLAUDE.md`，会把它挪出来。用户想去掉，就删掉这段，或在 CLAUDE.local.md 里写 `<!-- floorplan:off -->`，这样它不会再回来。在 Codex 下构建会跳过这件事：Codex 没有这种个人的、不提交的笔记（AGENTS.md 是跟团队共享的），所以那里也不要加。

6. **给每个文件和每条接口写说明。**
   `node ${CLAUDE_SKILL_DIR}/scripts/describe.mjs <root>`
   它为每个模块写一张工作表（`floorplan/.cache/worksheets/<key>.md`），以及一份待填的骨架（`floorplan/descriptions/<key>.json`）。每张工作表是每个文件的摘要（文档注释、定义了什么、用了什么，以及哪些文件引用了它、给它发网页请求、或点了它的名）和每条接口（处理函数、文档注释），并引用它列出的每条接口的代码，以及很短的文件的全文（密钥已遮住）。大多数文件不用打开就能写说明。
   - 先读 [references/writing-descriptions.md](references/writing-descriptions.md)，尤其是 "Say what it does today"：按引用出来的代码写它在做什么；是占位就直说；工作表或代码没写的，不要声称谁在跑它、谁在用它。
   - **超过大约 150 个文件：** 如果有并行的子助手，把工作表拆给它们，每个大约 100 到 150 个文件，按区域分组（后端接口、服务、脚本、测试、界面）。给每个子助手它的工作表键、项目根目录和写作指南，并告诉它只改自己的 `descriptions/<key>.json`，键不要动。
   - **比较小的项目：** 你自己写。

   然后重新构建。构建会报告 `DESCRIPTIONS files X/Y · routes X/Y`。两边都要到 100%：再跑一次 describe.mjs，它只列出还缺的。

7. **标出最近改动。** 地图会突出刚做过的事：那些卡片得到绿色的「改过了」或「新加的」标记，包含它们的部分显示「N 处改动」，悬停能看到你的备注，**最近改动**按钮把它们排到同一块板上。每次新建、每次更新都做，因为它会换掉上一次的高亮。
   `node ${CLAUDE_SKILL_DIR}/scripts/recent.mjs <root>`
   它列出上次地图以来变了什么、还没提交的改动和最近的提交，每一项都对上它在地图上的那张卡片。*为什么*由你来写：
   - **算什么。** 这次对话里你或你的子助手做的事是主要来源。用你已经知道的。如果你在这里什么都没做（新开的会话），就用 recent.mjs 里明显还在进行的：未提交的改动和最新的提交。如果什么都没有，写 `{ "tasks": [] }`，把旧的高亮清掉。
   - **写 `floorplan/recent-work.json`。** 用户让做的每一件事写成一个任务：`title`（2 到 5 个词）、`request`（他们怎么说的，缩短；这里没人开口时留 `""`，比如只是根据提交在整理，因为地图会把它显示成「你当时说：……」）、`summary`（1 到 2 句：为这件事做了什么、现在到哪了，包括删掉的，因为删掉的文件没法高亮）。然后加 `items`：变了的卡片，用文件路径、节点 id 或 `"METHOD /path"`，带上 `change`（`"new"` 或 `"changed"`）和 `note`。
   - **每条备注都回答「这和他们要的有什么关系？」** 用一两句人话，说这张卡片上改了什么、为什么这个请求需要它。例如写「现在能认出地址是先拼进一个变量里的网页请求，所以订单页和库存页才看得到服务器调用。」不要写「加了 flattenTemplates 和 variableUse 这两个辅助函数」。
   - **只突出要紧的。** 挑这次请求里行为变了的文件和接口，通常 3 到 15 个。测试和顺手改的跳过，除非它们就是这次的重点。一个文件改了接口，可以把文件和接口都列上。
   - **给所有人看的地图，不要把代码里的词写进备注。** 备注里绝不放密钥，也绝不编造示例值：只说代码里看得到的。

   格式见 [references/schema.md#recent-work](references/schema.md#recent-work)。然后运行 build.mjs。它报告 `RECENT WORK  N card(s) highlighted`，并对不上地图的引用给出提醒。

8. **打开，然后汇报。** 每次做地图或更新地图，最后都要把它放到用户面前：
   `node ${CLAUDE_SKILL_DIR}/scripts/open.mjs <root>`
   - 它在后台启动地图的服务器（这张地图已经有一个在跑就接着用），并在浏览器里打开。已经开着的标签会就地刷新，不会再开一个新的。
   - 它打印网址、提问能不能用（找到了 Claude Code 命令行或 Codex 没有），以及怎么停掉服务器。最后一个标签关掉大约两小时后，服务器自己也会停。
   - **在 Codex 里**，把 open.mjs 放到沙箱外面跑（请求提升权限）：命令结束后服务器还得继续跑，提问也需要网络才能连上 Codex。如果不允许，就把 `node floorplan/serve.mjs` 交给用户，让他们在项目根目录自己的终端里跑。
   - 你自己有应用内浏览器或预览工具时，加上 `--no-open`，改用打印出来的网址在那里打开，这样地图就在对话旁边。
   - 如果这是用户够不着 127.0.0.1 的远程或无界面机器，跳过 open.mjs，告诉他们在自己的机器上运行 `node floorplan/serve.mjs`，或者走 Claude 应用那条路（第 9 步）。

   然后**汇报。** 先给网址，再用 3 到 5 行通俗简体中文讲你画出来的结构，包括让人意外的地方：绕圈的依赖、什么都塞在里面的大文件、没人用的区域、缠在一起的部分。一定要提到**严重的健康检查项**（`graph.health`；构建输出和 graph.json 里都有）。写死在代码里的密码或密钥，以及谁都能改数据的接口，主人需要听到。构建在 `what was checked` 下面用 `!` 标出的检查也要转告（例如一个在跑服务器的项目里却没找到任何接口）：那项检查根本没有东西可看，所以健康检查列表很短，并不等于没问题。绝不重复密钥的值。构建的 `NOT MAPPED` 那一行显示有很多文档或配置文件时，用一句话说明地图只画出它点名的那类文件（默认是代码，除非 `include` 另有说法），免得一张小地图被当成漏扫了，并说明可以加进去。告诉用户 `architecture.json` 和 `descriptions/` 他们可以改；以后做了更多事，只要说「更新地图」，只会重读有变化的部分。把这句人话给他们，不要甩一条命令：在 Claude Code 里插件命令是 `/floorplan:floorplan`（作为个人技能是 `/floorplan`），在 Codex 里是 `$floorplan`。第一次做时，用一句话说明地图不进 git。在 Claude Code 里，构建说了 `CLAUDE.LOCAL.MD  not added` 时，最后问一次：以后这个项目里的 Claude Code 会话要不要用这张地图；你会往他们个人的、不提交的 CLAUDE.local.md 里加一句短说明。只有对方说要，才加上（`build.mjs <root> --claude-md`）；他们说不要，以后更新就别再问。更新时，先讲他们要的那件事改了什么（标在**最近改动**下面）。

## 9. 打开地图、在上面提问

地图上有一条浮动的提问栏。用户打一个问题，助手用文字再加一块回答板来答：相关的卡片、它们之间的连线、每张卡片上的一句备注，以及可选的逐步走一遍。有两种方式给它提供回答，界面一样。

- **Claude Code 命令行或 Codex（最好）。** 地图的服务器（`floorplan/serve.mjs`，由第 8 步的 open.mjs 启动）在 http://127.0.0.1:4378 提供它，这个端口被占了就用下一个空闲端口。每个问题都用用户自己的登录，在项目里、只读地跑，所以回答可以引用真实代码：
  - **Claude Code：** `claude -p`，带着地图（通过 `floorplan/query.mjs`），再加上对源码的 Read、Grep、Glob。服务器在 PATH 或 `~/.local/bin` 里找 `claude`。
  - **Codex：** `codex exec`，在 Codex 的只读沙箱里，什么都不写进他们的 Codex 历史。服务器在 PATH 里找 `codex`，或用 Codex 应用自带的命令行。

  它用画这张地图的那个助手；没装就退到另一个。`--engine claude|codex` 强制用其中一个，`--claude <path>` 或 `--codex <path>` 指向不寻常的安装位置，`--model <name>` 选模型，`--editor <name or link>` 决定**在编辑器里打开**用哪个编辑器，盖过 architecture.json 里的 `editor`（open.mjs 会把这些都传下去）。用户也可以随时自己运行 `node floorplan/serve.mjs`，用 `node floorplan/serve.mjs --stop` 停掉后台那个。
- **Claude 应用。** 如果你跑在 Claude 应用里（有 Artifact 工具），可以提议把地图发布出去，让他们在那里打开，并用自己的 Claude 账号提问。那时回答只来自地图（名字、说明、连线、接口），不来自源码，提问栏会提示装上命令行会更好。发布方法：
  1. `node ${CLAUDE_SKILL_DIR}/scripts/build.mjs <root> --artifact`。这会写出 `floorplan/artifact.html`，里面没有这台机器的绝对路径。
  2. 用 Artifact 工具发布这个文件，`capabilities: {"sample": {}}`，以后再次发布保持同一个文件路径，网址才稳定。
  3. 每次更新之后，用 `--artifact` 重新构建并再次发布。

  发布上传的是地图（路径、名字、说明、结构），不是源代码，而且是传到他们私人的 claude.ai 账号。做之前先说清楚。
- **两个都没有：** `floorplan/index.html` 仍然可以直接在浏览器里打开。提问栏会说明还缺什么。

### 把一份副本发给别人

用户想把地图发给别人（同事、客户、没有 Claude 或 Codex 的人）时，导出一份。导出的是同一个 HTML 文件，但没有提问栏、没有给 Claude 或 Codex 的提示、没有编辑器链接、没有这台机器的文件夹路径或 git 远程地址。地图上的**导出**按钮在浏览器里做这件事；你在这里运行：

```
node floorplan/serve.mjs --export [<file>] [--include flows,notes,recent,health]
```

没给文件名时，它写成 `floorplan/<project>-map.html`。`--include` 默认是 `flows,notes`（流程和导览，以及钉在文件上的备注）；`recent` 加上最近改动，`health` 加上健康检查，规划蓝图上则是设计审查。用户没要就不要带上 health；如果他们要了，说明这份里列出了谁都能用的接口、以及密钥在代码的哪一行（绝不是密钥本身），所以只发给信得过的人。任何一份导出都能看出应用怎么拼在一起（每一块、每个文件、每条接口，带名字和说明），但没有源代码。

### 地图还会自动给他们什么

- **健康检查。** 顶栏一个按钮，带着重要问题的数量，打开一份人话列表，列出扫描发现的问题：
  - 密码和 API 密钥写进了代码，或写进了已提交的 `.env`；
  - 浏览器拿得到的变量里放了密钥（`NEXT_PUBLIC_`、`VITE_` 这类）；
  - Supabase 的表没有行级保护，以及允许任何人改一张表的策略（从 SQL 迁移里看）；
  - Firebase 规则（Firestore、Storage、Realtime Database）让任何人都能进，包括测试模式和它的到期时间；
  - Stripe 的到账通知不核对 Stripe 的签名就当真事处理；
  - 跨域设置允许任何网站来访问（带着登录凭证时更该修）；
  - 不登录就能改数据或读数据的接口（包括登录检查写在了接口那一行的上面，所以没生效）；
  - 没有谁在用的文件；
  - 超过大约 1000 行的文件，AI 改起来容易改坏。

  每条都有**在地图上标出来**（把相关文件和接口高亮，并带上备注）和**让 Claude 来改**或**让 Codex 来改**（一段可以直接粘贴的提示，写明具体文件、行号和安全的改法）。这些由扫描和构建时的 `scripts/lib/health.mjs` 算出来，绝不保存密钥的值，只保存文件、行号和一个打了码的提示。把它当成一次自动的快速检查，不是安全审计。
- **页面。** 构建会认出应用的页面（Next.js、React Router、Vue、SvelteKit、Remix、Nuxt、Astro、Expo、Angular、TanStack、Shopify 主题模板），用的是 `scripts/lib/screens.mjs`。它也会算出每个页面背后是什么：上面的部件、它发出的请求、应答的服务器代码和数据、外部服务。**页面**按钮让人从自己认识的那个页面出发。
- **新手导览。** 第一次打开会走大约一分钟，顶栏可以再看一遍。用的是你写的 `tour`，没有就自动拼一条。
- **默认说人话。** 连线类型读作「用到」「网页请求」「后台任务」。常见的技术词会加下划线，悬停有解释。**筛选 → 显示技术细节**切到开发者用语，并显示导出了什么。

用户也可以用**流程 → 请一条新流程**，让助手把一件事串起来（「退款是怎么回到顾客卡上的？」），变成一步一步的流程。有 serve.mjs 时，这些存进 `floorplan/custom-flows.json`，每次构建都会折进地图（指向已删除代码的步骤会丢掉，并给一个提醒）。把这个文件当作用户的内容：更新时留着，没人让你改就不要改。

## 备注

- 路径相对于项目根目录，用正斜杠。多个仓库并排时，路径从仓库文件夹开头，例如 `api-service/src/**`。
- descriptions 里的接口键是 `"METHOD /full/path"`，和工作表印出来的完全一致。
- 地图不向外发请求：构建把排版引擎（ELK）和字体从 `${CLAUDE_SKILL_DIR}/assets/vendor/` 内嵌进去，所以断网也能用。
- 网页请求的连线，是把调用处的 URL 字符串（包括先放进变量的地址、嵌套的模板字符串，以及同一文件里给路径加前缀的小辅助函数）对上接口定义（Flask、FastAPI、Express、Fastify、Next.js、Spring、ASP.NET Core、Go 等），并把 blueprint、router、plugin 的前缀和嵌套挂载解析出来。Firebase 的可调用函数按名字对上（`CALL /<name>`，来自 `httpsCallable`），`onRequest` 函数按 URL 对上；Supabase Edge Functions 是 `/functions/v1/<name>` 上的接口，由 `supabase.functions.invoke('<name>')` 到达（摘要里的 SUPABASE EDGE FUNCTIONS 那一行在数它们）；摘要的 FIREBASE FUNCTIONS 一节列出定时和触发函数，它们属于一个 `worker` 节点。Laravel 路由（`Route::get`、`resource`、分组，以及在分组里或由 `withRouting` 加载的路由文件）落在应答它们的控制器方法上；Laravel Wayfinder 调用和 Inertia 页面按路由名、控制器方法、以及该方法渲染的页面连起来；摘要的 LARAVEL 一节数它们，并点名没有被加载的路由文件（它们的地址可能缺前缀：在汇报里提一句）。Serverless Framework 的接口来自 `serverless*.yml` 里的 `http` 和 `httpApi` 事件（以及它们用 `${file(...)}` 包含的文件），落在处理函数的文件里，或落在处理函数只是把请求转交过去的那个函数上；摘要的 SERVERLESS 一节数它们，点名找不到处理文件的函数，并列出定时、队列、流和其他后台函数，它们属于一个 `worker` 节点。把这些当成很强的提示。如果一条重要的服务到服务的连线缺失了，就补一条明确的边。
- Shopify 主题（有 `layout/theme.liquid` 的文件夹）：模板用 section，section 渲染 snippet 并加载资源，全按名字连。作为应用块或嵌入加进来的应用，在 EXTERNAL PACKAGES 里是 `shopify-app:<app>`，所以每个要紧的应用做一个外部节点，带上那个包名。通过 Shopify 的 `routes` 对象发出的请求（购物车和搜索）看不见；要紧的地方，给 Shopify 外部节点补一条明确的边。
- 不要手改 graph.json 或 index.html；每次构建都会重新生成。
