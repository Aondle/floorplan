# architecture.json 的格式

`floorplan/architecture.json` 描述结构：大块、小块、外部服务、流程。单个文件和接口的名字、说明放在 `floorplan/descriptions/*.json`（见 [writing-descriptions.md](writing-descriptions.md)）。分开写，是为了几个助手同时写也不会撞车。`build.mjs` 会拿这两份去对扫描结果，并按字段报问题。

给人看的名称、说明、流程和导览用通俗简体中文。下面的字段名、枚举值和路径保持原样。

目录：[顶层](#顶层) · [nodes](#nodes) · [文件怎么分进去](#文件怎么分进去) · [edges](#edges) · [annotations](#annotations) · [flows](#flows) · [recent work](#recent-work) · [Full example](#full-example)

## 顶层

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `$schema` | `"floorplan/architecture@1"` | 否 | 标记 |
| `project` | object | 是 | `name`（字符串，必填），`summary`（1 到 3 句通俗中文），`entrypoints`（文件路径） |
| `nodes` | array | 是 | 大块和小块。见下 |
| `edges` | array | 否 | 扫描看不见的连线 |
| `annotations` | array | 否 | 钉在某个文件上的备注 |
| `flows` | array | 否 | 带着人在板上走一遍的流程 |
| `tour` | array | 否 | 第一次打开时的「新手导览」：3 到 8 站 `{ "node": "<节点 id 或文件路径>", "title": "…", "note": "…" }`，用通俗中文，按新人该看的顺序。第一条流程会自动接在最后 |
| `audience` | `"everyone"` \| `"developers"` | 否 | 名字和说明写给谁。默认 `"everyone"`：不懂代码的主人也能懂的大白话（这件事对生意有什么用）。`"developers"`：给工程师的技术说法，句子仍用中文 |
| `include` | string[] | 否 | 要画进地图的文件类别。默认 `["code"]`。还可以是 `config`、`docs`。没画进去的，扫描和构建会按类别列在 `NOT MAPPED` 那一行 |
| `ignore` | string[] | 否 | 整块留在板外的通配路径（生成的代码、拷进来的第三方库、样例） |
| `editor` | string | 否 | **在编辑器里打开**用哪个编辑器。默认 VS Code。一个名字（`vscode`、`vscode-insiders`、`vscodium`、`cursor`、`windsurf`、`zed`、`idea`、`phpstorm`），或编辑器自己的链接，里面带 `{path}`、`{line}`、`{column}`，例如 `"zed://file/{path}:{line}"`。只有用户说了自己用哪个编辑器才写 |

## nodes

每个节点是板上的一张卡片。层次来自 `parent`。没有 parent 的节点在顶层板上。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | string | 唯一；字母、数字、`_ - .`。习惯按父节点加点（`api.orders`） |
| `label` | string | 给人看的短名字，用通俗中文（「订单」） |
| `kind` | enum | `ui` `service` `worker` `library` `feature` `data` `config` `test` `script` `infra` `external` |
| `parent` | string | 包住它的那个节点的 id |
| `summary` | string | 一句话：它负责什么。用通俗中文 |
| `details` | string | 可选的更长备注；空行分段 |
| `paths` | string[] | 认领文件的通配路径（见下） |
| `exclude` | string[] | 从 `paths` 里再抠出去的通配路径。**所有后代都继承**，例如前端节点上 `"exclude": ["**/*.test.tsx"]` 会把挨在一起的测试从每个孩子里排除，这样单独的「测试」节点才能认领它们 |
| `packages` | string[] | **外部节点：** 这个节点代表的包名，例如 `"stripe"`、`"npm:@stripe/*"`、`"pypi:sqlalchemy"`。引用了它们，就会变成指向这个节点的边 |
| `hosts` | string[] | **外部节点：** 代码里调用的主机名，例如 `"api.stripe.com"`、`"*.squareup.com"`。调用变成 `http` 边 |
| `tags` | string[] | 自由文字，显示在侧栏里 |

`kind` 简要说明：

- `ui`：给人用的界面和应用
- `service`：一个可以单独跑起来的服务器
- `worker`：后台任务和队列
- `library`：共用的代码
- `feature`：一个服务或界面里的一块竖切功能
- `data`：数据模型、迁移、数据库这一层
- `config`：设置
- `test`：自动检查
- `script`：一次性的和运维用的脚本
- `infra`：部署、持续集成、基础设施描述
- `external`：数据库和第三方服务。它们自己没有文件

### 通配路径怎么写

- `**` 匹配任意层目录，`*` 停在一段路径里，`?` 匹配一个字符，`{a,b}` 是多选一。
- 整个文件夹名在方括号里，像 `[id]`、`[...slug]` 或 `[[...slug]]`（Next.js、SvelteKit），按字面匹配那个文件夹：`app/orders/[id]/**`。别的地方，`[abc]` 匹配其中的一个字符。
- 没有通配符的一条，也按目录匹配：`backend/app` 等于 `backend/app/**`。
- 路径相对于项目根目录。多个仓库并排时，从仓库文件夹开头。
- 一条路径必须合法（每个 `[` 和 `{` 都关上，`[a-z]` 这类范围按顺序），并且克制：最多 300 个字符、12 个通配符、8 组 `{…}`，一个列表最多 500 条。超出就是构建错误，并点名字段，例如 `nodes[3] ("web").paths[0] "[evil" is not a valid pattern: it has a "[" with no "]" to close it`。

### 文件怎么分进去

每个被包含的文件恰好进一个节点：

1. 收集 `paths` 匹配这个文件、并且 `exclude` 没把它排除的节点。
2. **最深**的节点赢，所以孩子胜过父亲。父节点可以给一个宽的通配路径（`web/**`），孩子给更窄的；没有孩子认领的文件留在父节点上。
3. 同样深的节点之间，字面量前缀更长的通配路径赢。真的打平会给出提醒。
4. 没有节点认领的文件，进一张自动的 **未分进去** 卡片。把它压在大约 10% 以下。

地图上，一个节点自己的文件超过大约 24 个时，会自动按文件夹收成卡片，所以你不必为每个目录做一个节点。一个节点要有含义才做。

## edges

只补静态分析找不到的。引用（`import`）和对上了接口的网页请求（`http`）已经在扫描结果里。

| 字段 | 类型 | 含义 |
|---|---|---|
| `from`、`to` | string | 节点 id **或** 文件路径 |
| `kind` | enum | `import` `call` `http` `rpc` `event` `queue` `data` `config` |
| `label` | string | 短标签，例如 `"POST /orders"`、`"order.paid"`、`"reads/writes"`。给人看的可以用中文 |
| `description` | string | 可选的一句话，点这条线时显示。用通俗中文 |

适合补的：

- 服务 → 数据库（`data`）
- 发出的一方 → 队列 → 接住的一方（`queue` / `event`）
- 第三方打进来的通知（`http`，从外部节点到处理它的地方）
- 定时任务 → 那件工作（`call`）
- Firebase 的后台函数（定时、Firestore / Storage / Pub/Sub 触发，来自扫描的 FIREBASE FUNCTIONS 列表）→ 一个 `worker` 节点；把触发它们的集合或主题连上（`event`）
- 地址的前半段写在设置里、匹配器漏掉的调用（`http`）

## annotations

`{ "path": "<file>", "note": "…", "tags": ["hotspot"] }` 把一条备注钉在一个文件上。那张卡片会有一圈强调边。少用，留给什么都塞在里面的大文件、容易踩错的不变量，或还在用的废弃代码。`note` 用通俗中文。

## flows

```json
{ "id": "checkout", "title": "结账", "description": "可选",
  "steps": [ { "node": "web.cart", "note": "顾客点了付款" }, { "node": "api.orders", "note": "把这笔订单建出来" } ] }
```

- 每一步的 `node` 是节点 id 或文件路径。至少 2 步。
- 地图会移到相邻两步都能看见的那块板，并在它们之间做一次动画。
- `note` 写成一个新人愿意听的讲解，用通俗中文。

## recent work

`floorplan/recent-work.json` 是单独的文件，每次新建和更新都重写。它放的是刚做过的事，对着用户要求的那件事来说。地图给那些卡片绿色的「改过了」或「新加的」标记，包含它们的部分显示「N 处改动」，把每条 `note` 加到卡片的悬停上，并在**最近改动**按钮和总览侧栏里列出这些任务。

```json
{
  "updatedAt": "2026-10-27T10:30:00Z",
  "tasks": [
    {
      "title": "在订单页上退款",
      "request": "让店员在订单自己的页面上直接退款",
      "summary": "店员现在可以在订单页面上退全部或一部分。钱通过 Stripe 回到顾客的卡上，顾客会收到一封邮件。超过 500 美元的退款需要店长。",
      "items": [
        { "ref": "shop-api/app/services/refunds.py", "change": "new", "note": "新加的：算出退多少，通过 Stripe 退回去，并记在这笔订单上。这就是这次要的那件事的核心。" },
        { "ref": "POST /api/orders/<int:order_id>/refund", "change": "new", "note": "退款按钮发出的那个请求；钱还没动之前，它先检查有没有超过店长才能批的额度。" }
      ]
    }
  ]
}
```

| 字段 | 含义 |
|---|---|
| `tasks[].title` | 2 到 5 个词，悬停时显示，也当这块板的标题。用中文 |
| `tasks[].request` | 用户怎么说的（缩短）。显示成「你当时说：……」 |
| `tasks[].summary` | 1 到 2 句：为这件事做了什么，现在到哪了。删掉的写在这里；删掉的文件不在地图上 |
| `items[].ref` | 文件路径、节点 id，或和地图上完全一致的 `"METHOD /path"`。不在地图上的引用会被丢掉，并给出提醒 |
| `items[].change` | `"new"` 或 `"changed"`（默认） |
| `items[].note` | 1 到 2 句人话：这张卡片上改了什么，以及它怎么服务于这次请求 |

`{ "tasks": [] }` 清掉所有高亮。

## Full example

一个前端仓库和一个后端仓库并排放着：

```json
{
  "$schema": "floorplan/architecture@1",
  "project": {
    "name": "Acme 商店",
    "summary": "顾客用的网站把下单和付款交给后面的主服务器；订单存在数据库里，付款走 Stripe。",
    "entrypoints": ["shop-api/app.py", "shop-web/src/app/page.tsx"]
  },
  "ignore": ["shop-api/migrations/versions/**"],
  "nodes": [
    { "id": "web", "label": "顾客用的网站", "kind": "ui", "summary": "顾客浏览商品、下单时看到的页面。", "paths": ["shop-web/src"] },
    { "id": "web.pages", "parent": "web", "label": "页面", "kind": "feature", "paths": ["shop-web/src/app"] },
    { "id": "web.api", "parent": "web", "label": "跟服务器说话的代码", "kind": "library", "summary": "网站上每一次向主服务器要数据，都从这里发出。", "paths": ["shop-web/src/lib/api*"] },
    { "id": "api", "label": "主服务器", "kind": "service", "summary": "接住网站的请求，管订单、库存和付款。", "paths": ["shop-api/app.py", "shop-api/app"] },
    { "id": "api.routes", "parent": "api", "label": "接到的请求", "kind": "feature", "paths": ["shop-api/app/routes"] },
    { "id": "api.models", "parent": "api", "label": "存着的记录", "kind": "data", "paths": ["shop-api/app/models"] },
    { "id": "tests", "label": "自动检查", "kind": "test", "paths": ["shop-api/tests", "shop-web/**/*.test.{ts,tsx}"] },
    { "id": "pg", "label": "Postgres", "kind": "external", "packages": ["pypi:sqlalchemy", "pypi:psycopg2"] },
    { "id": "stripe", "label": "Stripe", "kind": "external", "packages": ["stripe"], "hosts": ["api.stripe.com"] }
  ],
  "edges": [
    { "from": "stripe", "to": "api.routes", "kind": "http", "label": "付款通知", "description": "payment_intent.succeeded 把订单标成已付款。" }
  ],
  "annotations": [
    { "path": "shop-api/app/routes/orders.py", "note": "订单状态的每一次变化都在这里。", "tags": ["hotspot"] }
  ],
  "flows": [
    { "id": "checkout", "title": "结账", "steps": [
      { "node": "web.pages", "note": "购物车页面把订单交出去" },
      { "node": "web.api", "note": "POST /api/orders" },
      { "node": "api.routes", "note": "核对并建立这笔订单" },
      { "node": "stripe", "note": "向 Stripe 发起一笔收款" }
    ]}
  ]
}
```
