# 规划蓝图：还没做出来的系统，先画一张地图

规划蓝图是同一张地图，依据计划来画，而不是依据代码。对方有一份需求文档、一份说明，或只是一大段想做的东西，地图就展示需要哪些块、块与块怎么连、每个页面靠什么、还有什么没定。

名字、说明、流程讲解和设计审查里由你来写的话，用通俗简体中文。代码路径、字段名、接口 URL 保持原样。

你在 `floorplan/` 里写两个文件：

- `plan.json`：这个系统将会有的文件、接口和连线（就是本文件说的这份）。
- `architecture.json`：各个部分、外部服务、流程和导览，写法和代码地图完全一样（[schema.md](schema.md)）。

`plan.mjs` 把 `plan.json` 变成 `build.mjs` 期望的那份扫描结果，所以后面的步骤和真实代码一样。卡片画成虚线，并标上**规划蓝图**；健康检查变成对这份计划的**设计审查**；每一块都有**让 Claude 来做**（或 Codex），里面是一段可以直接拿去只做这一块的请求。

目录：[怎样规划才有用](#怎样规划才有用) · [plan.json](#planjson) · [设计审查查什么](#设计审查查什么)

## 怎样规划才有用

- **规划到文件和接口这一层**，不要只画几个框。页面、设计审查和「让 AI 来做」的提示都靠这个。一个小产品通常是 15 到 60 个文件、10 到 40 条接口。不要把每个小辅助函数都规划出来：每个页面一个文件、每一组接口一个文件、每个外部服务一个文件、每一种要存的数据一个文件，大约就对了。技术组合规定一个地址一个处理文件时（Next.js 的 `route.ts`、SvelteKit 的 `+server.ts`），就按那个来规划；文件再多一点也没关系。
- **选一套常见、好用的技术组合**，除非需求点了名，并写进 `stack`。优先一个靠 AI 干活的个人会选的：Next.js 或 React 网站、Node 或 Python 服务器、Postgres、Stripe、一家托管的邮件服务。用这套技术里真实、常规的路径（`web/app/checkout/page.tsx`、`api/src/routes/orders.ts`）。
- **需求里描述的每个页面，都是一个带 `screen` 地址的文件。** 每个页面用 `calls` 写它用到的接口，用 `uses` 写它由哪些部分拼成。
- **每条接口都要有 `access`**；只有一部分登录的人能用时再写 `who`（「那个门店的店长」「账号的主人」）。从需求里定。需求没说、而这事又要紧，就先空着（审查会标出来）或加一个问题。必须对所有人开放、又会改数据的接口（登录验证码、注册、游客结账）要写 `publicBecause`：为什么必须开放，以及什么挡住滥用。
- **不要编造需求。** 需求没说、你不得不选的，把选择写进 `assumptions`。答案会改变做什么、而你没法合理替对方选的，放进 `questions`，并写上它影响哪些部分。需求里列出的每个未决问题都带进 `questions`，除非需求在别处已经定了；如果你按比较可能的答案规划了，也在 `assumptions` 里说一声。只有需求把根本性的事留空（谁在用、网页还是手机、要不要登录、钱会不会过手），才在一开始问用户 2 到 3 个问题。
- **外部服务和存放数据的地方，是 architecture.json 里的 `external` 节点**（Stripe、数据库、邮件服务）。文件通过 plan.json 里的 `services` 和 `data` 连到它们。`data` 写在直接跟数据库说话的文件上（一个数据库帮手，或每个取数据的文件），不要写在每个用到它们的文件上：页面会顺着 `uses` 找到它们。
- **后台的活**（定时邮件、夜里的任务、排队的工人）有自己的文件，以及一个 `worker` 节点。

## plan.json

```json
{
  "$schema": "floorplan/plan@1",
  "source": "docs/prd.md",
  "stack": ["Next.js 网站", "Node.js 加 Express 服务器", "Postgres", "Stripe"],
  "assumptions": ["店员和顾客共用一套登录，店员会被标出来。"],
  "questions": [{ "question": "顾客可以免费取消吗？", "about": ["POST /api/orders/:id/cancel"] }],
  "files": [ { "path": "web/app/checkout/page.tsx", "name": "结账页", "description": "…", "screen": "/checkout", "uses": ["web/lib/api.ts"], "calls": ["POST /api/orders"] } ],
  "endpoints": [ { "method": "POST", "path": "/api/orders", "file": "api/src/routes/orders.ts", "name": "提交订单", "description": "…", "access": "signed-in" } ]
}
```

| 字段 | 含义 |
|---|---|
| `source` | 根据什么规划的：项目里需求文档的路径，或几个字，比如「对话里的一段描述」 |
| `stack` | 选了哪些技术，用人话写 |
| `assumptions` | 需求没说、由你定下来的选择。显示在地图的总览上 |
| `questions` | `{ question, about }`：需求留着没定的决定。`about` 列出节点 id、文件路径或 `"METHOD /path"`。每一条会留在设计审查里，直到被回答并删掉 |
| `files` | 每一个计划中的文件（见下） |
| `endpoints` | 每一条计划中的接口（见下） |

**files[]**

| 字段 | 含义 |
|---|---|
| `path` | 它会放在哪，相对于项目文件夹。必填，且不能重复 |
| `name`、`description` | 人话名字和一句通俗中文，写法跟描述真实代码一样（[writing-descriptions.md](writing-descriptions.md)） |
| `screen` | 给人打开的页面：它的地址（`/checkout`、`/orders/:id`）。有了它，**页面**里就会出现这一屏 |
| `uses` | 它由哪些别的计划文件拼成，或直接调用哪些（变成「用到」的连线） |
| `calls` | 它调用的接口，写成 `"METHOD /path"`，和 `endpoints` 里完全一致 |
| `services` | 它说话的 `external` 节点的 id（Stripe、一家邮件服务） |
| `data` | 它读或写的数据存放处的节点 id（通常是数据库） |

**endpoints[]**

| 字段 | 含义 |
|---|---|
| `method` | GET、POST、PUT、PATCH、DELETE，或 CALL（可调用函数，例如 Firebase 的 `onCall`） |
| `path` | 地址，以 `/` 开头。会变的部分用 `:name`（`/api/orders/:id`） |
| `file` | 处理它的那个计划文件。必填 |
| `name`、`description` | 和文件一样 |
| `access` | 谁可以用：`public`（任何人）、`signed-in`（登录了的人）、`team`（只给运营这个服务的人，给他们自己的管理页，不是这个应用的用户）、`webhook`（另一家公司的服务，必须证明是他们）或 `internal`（只有你自己的服务） |
| `who` | 配 `signed-in`：哪些登录的人，几个字（「那个门店的店长」「账号的主人」）。任何登录用户都可以时就不要写 |
| `publicBecause` | 配 `public`：为什么必须开放，以及什么限制滥用（「登录必须在任何人登录之前就能用；每个号码每小时 5 个验证码」）。有了这一句，设计审查就不再把这条开放接口标成问题 |

architecture.json 里节点的 `paths` 通配路径，把计划文件分到各个部分，和代码一样。目标是没有没分进去的文件。方括号里的文件夹名（`app/orders/[id]/**`）按字面匹配。

plan.mjs 的「calls to planned endpoints」按每次调用计数；构建的 "http" 连线按「调用方到文件」再加到外部服务的连线计数，所以两个数字不一样。

## 在地图上改

地图是通过它的服务器打开的（open.mjs）时，提问栏有一个**提问 / 改规划**开关。一句修改请求（「把退款也规划进去」「不要管理页了」）会交给同一个助手，只读。它回复完整的、更新后的 plan.json 和 architecture.json，服务器用 plan.mjs 和 build.mjs 检查。检查失败，或新文件没有落到任何一块下面，它会把问题退回一次。然后保存文件、重画地图（开着的标签会刷新），并把新增和改过的卡片标成最近改动，带**撤销**。被换掉的文件留在 `floorplan/.cache/history/`。设计审查的每一条都有**在地图上处理**（地图由服务器打开时，见上），它会在「改规划」里放好一段请求：没定的问题，这段请求以「我的回答：」结尾，等人补完；助手随后删掉这个问题，并把答案做进计划。你手工改，或通过这个技能改，是同一条路：改文件，再运行 refresh.mjs。

## 设计审查查什么

- 会改数据、又对任何人开放的接口，除非 `publicBecause` 说明了为什么；
- 没有定 `access` 的接口；
- 每一个还没定的问题，并指向它影响的部分；
- 没有任何计划中的页面或服务去调用的接口；
- 什么都没连上的计划文件。

地图由服务器打开时，每条都有**在地图上处理**（见上）；否则是**让 Claude 或 Codex 来处理**，一段可以粘贴给助手的请求。
