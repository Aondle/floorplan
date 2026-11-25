# 开发 Floorplan

本仓库是 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 的简体中文本土化副本，原作者是 [Hayden Smith](https://github.com/haydenschmitty)。下面说的是怎么改这份软件本身。

## 仓库怎么排

```
.claude-plugin/
  plugin.json          插件：名字、版本、作者
  marketplace.json     这个仓库作为它自己的、只有一个插件的来源
  icon.png
.codex-plugin/
  plugin.json          给 Codex 的同一份插件（同一个技能、同一个版本）
  icon.png
.agents/plugins/
  marketplace.json     这个仓库作为 Codex 的插件来源
skills/floorplan/
  SKILL.md             Claude 和 Codex 跟着走的流程
  agents/openai.yaml   Codex 怎么列出这个技能
  workflow.json        和 SKILL.md 同一步骤，做成数据，给不在对话里跑的时候用
  references/          Claude 干活时读的格式和文风
    schema.md                architecture.json 和 recent-work.json
    choosing-boundaries.md   怎么把一个代码库切成一张好地图
    writing-descriptions.md  人话名字和说明
    blueprint.md             plan.json，给按 PRD 规划的地图
  scripts/             Node.js，没有第三方依赖；Claude 跑这些
    status.mjs     有没有地图、过时多少（技能加载时跑）
    scan.mjs       仓库、文件、引用、接口、请求 → .cache/scan.json
    plan.mjs       规划蓝图的 plan.json → 同样的 .cache/scan.json
    build.mjs      校验、把文件归位、连上、健康检查、页面 → graph.json + index.html
    describe.mjs   给 Claude 用来给文件和接口起名、写说明的工作表
    refresh.mjs    增量更新：重新扫描、接着用、标出变化、重建
    recent.mjs     标出最近改动要用的事实
    open.mjs       启动或接着用地图的服务器，并打开浏览器
    lib/           抽取、引用解析、Nuxt 自动导入、路由匹配、健康检查、页面、正在跑的是哪个助手、帮手
  assets/
    viewer.html    地图（构建填进去的模板）
    ui/            地图上的附加：外观按钮、规划蓝图、术语、健康检查、最近改动、页面、导览、候补名单卡片
    graph-query.js 共用的地图查询（查看器、query.mjs、提问的指示）
    serve.mjs      复制进每个项目的 floorplan/ 文件夹；通过 Claude Code 或 Codex 回答
    page-safety.mjs  数据与代码进入页面 <script> 块的唯一办法，以及它的内容安全策略
                   （build.mjs 用，并复制到 serve.mjs 旁边）
    query-cli.mjs  变成 floorplan/query.mjs
    logo.png、favicon.png
    vendor/        打包进来的排版引擎（elkjs）和字体，连同许可证
tests/                 回归测试，以及它们画的样例项目
tools/checksums.mjs    为一次发布写下 CHECKSUMS.txt，并拿已安装的副本去对
CHECKSUMS.txt          插件实际会跑的每个文件的 SHA-256，截至上一次发布
docs/                  这些指南
```

`writing-descriptions.md` 里的 "Plain language"、"Say what it does today"、"Jargon → plain" 仍是英文标题，左列仍是英文词。那是程序和测试认的固定字。

## 试用手头这份副本

从你的本地文件夹安装，而不是从 GitHub：

```bash
claude plugin marketplace add /path/to/floorplan
claude plugin install floorplan@floorplan
```

从本地文件夹装的插件直接从那里跑，所以改动在下一轮对话就生效，不用再更新一步。

要在 Codex 里试，见[试用手头这份副本](codex.md#trying-a-working-copy)。你加上一个本地插件时，Codex 会复制一份，所以每次改完都再跑 `codex plugin add floorplan@floorplan`。build.mjs 上的 `--agent claude|codex|none`（或 `FLOORPLAN_AGENT`）和 serve.mjs 上的 `--engine claude|codex`，让你从任何地方试任一个助手的地图。

脚本也可以自己跑，这是改它们最快的办法：

```bash
node skills/floorplan/scripts/scan.mjs /path/to/project
node skills/floorplan/scripts/build.mjs /path/to/project
node skills/floorplan/scripts/open.mjs /path/to/project
```

`build.mjs` 需要项目里有一份 `floorplan/architecture.json`，所以先把技能跑一次，或按[格式](../skills/floorplan/references/schema.md)手写一份小的。

## 测试

```bash
npm test
```

测试用的是 Node 自带的测试运行器，所以没什么要装的（`npm test` 就是 `node --test`）。GitHub 在每次推送和每个拉取请求上跑它们，Linux 和 Windows，Node 18、20 和 22；macOS 每周一次，也可以手动（Actions → macOS → Run workflow），因为那边的 macOS 机器经常全忙着。上游的自动检查徽章仍指向 haydenschmitty/floorplan。

| 文件 | 它查什么 |
|---|---|
| `parsing.test.mjs` | 按语言和框架查引用、接口、网页请求和文档注释 |
| `aspnet.test.mjs` | ASP.NET Core：控制器、约定路由、继承来的、最小 API（包括从另一个文件调用的登记方法）和 SignalR 接口；C# 文件之间的 `using` 和 `global using` 连线；忽略大小写对上的请求；跳过 .NET 测试项目的文件夹（这两项只对 C#，所以别的框架仍精确匹配、并留着它们的接口）；以及健康检查（谁可以调用每个接口、别的文件里的处理函数和基类、按项目的整应用策略、CORS、Stripe 到账通知、连接串里的密码，每一项都有必须放过的相似物）；还有故意做成让模式匹配变慢的 C# 文件 |
| `tsconfig-inheritance.test.mjs` | 本地配置的继承：数组和单个基底、别名连线、相对路径、覆盖、旧的 baseUrl，以及绕圈 |
| `helpers-lib.test.mjs` | 通配、文件类型、命令行旗标、退路名字 |
| `secrets.test.mjs` | 健康检查找得到密钥、打码，并放过占位符：脚本或流水线填进去的变量（psql 变量也算，有没有空格都算）、SQL 注释、葡萄牙语、西班牙语、法语和德语里的「你的密钥写这里」、文件路径、记录 id、自动填充词、编造的密钥和可公开密钥，每一项旁边都有一个它仍必须找到的真密钥 |
| `health.test.mjs` | 健康检查把哪些接口叫成谁都能用（`fixtures/` 里的 FastAPI、Flask 和 Express 样例）：按名字认的登录检查，以及 FastAPI 依赖按它的代码实际做什么来认（工厂的结果、放在变量里的 `Depends()`、放在常量里的列表、抛出 401 的函数），还有必须仍然算敞开的相似物（日志装饰器、形状校验、什么都不查的依赖） |
| `fastapi-router-auth.test.mjs` | 一份 FastAPI 的 `APIRouter(...)` 整段读完，不管依赖嵌多深（`Depends(require_workspace("tours"))`），每个依赖都考虑，`authenticate` 和 `authorize` 算数，以及必须不算的相似物：数据库会话、注释或字符串里的检查、另一个路由器的检查、括号永远不闭合的路由器 |
| `fastapi-http-middleware.test.mjs` | 一个把调用者挡回去的 FastAPI `@app.middleware("http")` 保护那个应用的每条路由；只加头、记日志或计时的那个什么都不保护 |
| `express-global-guard.test.mjs` | 哪些 Express 和 Hono 中间件算它后面那些接口的登录检查（整应用、一条路径，或一个路由器上），以及必须不算的相似物（`cors`、字符串里的一个头名字、会话、一个叫 `authRoutes` 的路由器），还有健康检查点出「没问题」所依靠的那次整应用检查 |
| `express-mounts.test.mjs` | Express 和 Hono 的路由：任何名字的路由器、跟着索引文件、工厂、`require()` 和命名空间引用走的挂载、一个文件里嵌套的路由器、交给 `app.use()` 但不是路由器的名字，以及挂载上的检查落到对的接口上（样例在 `fixtures/`） |
| `public-by-design.test.mjs` | 健康检查因为「故意公开」而放过的东西（订阅、项目自己公布的地址、缓存的响应、没什么隐私可给的路由、Payload CMS、追踪器令牌、工具按名字打开的文件、Expo Router 页面、另一个文件点了名的文件），每一项都有一个它仍必须报告的差一点 |
| `health-checked.test.mjs` | 健康检查的「查过什么」：每项检查说出它读了什么或什么都没找到；代码在跑服务器却没找到接口时更响；在 graph.json、构建报告和 `--json` 里，以及健康检查面板（它的代码对着一个替身查看器跑） |
| `nuxt.test.mjs` | Nuxt 自动导入：页面连到它们没用 import 就用到的组件和组合函数，来自 `.nuxt/` 的名单或 Nuxt 的文件夹习惯；文件自己 import 或定义的名字放过；`.nuxt/` 不进地图 |
| `stack-health.test.mjs` | 健康检查对 Supabase 行级安全（包括循环里的动态 SQL）、Firebase 规则、Stripe 到账通知的签名、公开变量里的密钥和 CORS 的检查，每一项必须放过的相似物，以及一个样例应用做错和做对 |
| `django.test.mjs` | Django：一个应用的 `urls.py` 在前缀下被包含、网站的请求对上它，以及应用之间的绝对引用到达另一个应用，而不是引用方自己的 `apps.py` |
| `jvm-imports.test.mjs` | Kotlin 和 Java：不按文件名来的顶层声明的引用；从文件自己的包或一个 `.*` 引用用到、却没有 import 行的名字；项目自己的包从不列成外面的包；必须保持不连的（注释、字符串、私有声明、别的包、从别处 import 来的名字、测试帮手）；一个有几千个文件的包；以及故意做成让读取变慢的文件 |
| `swift.test.mjs` | Swift：模块引用，以及一个文件用到的顶层类型、函数和值；通过 `Package.swift` 的目标（自定义 `path:`、嵌套的和注释掉的目标），或没有包的 Xcode 应用；文件自己模块里的名字赢过 import 来的同名；必须保持不连的（嵌套和私有声明、什么都没用到的模块、测试帮手）；以及故意做成让读取变慢的文件 |
| `subpath-imports.test.mjs` | 通过 package.json `"imports"` 的引用（`#lib/x`）：最近的 package.json、最具体的键、数组和条件、退回到 tsconfig 的 `paths`、差一点的保持不连，以及不能让扫描停住的古怪或无限嵌套的形状 |
| `fastify.test.mjs` | Fastify：带前缀登记的插件、嵌套的 register，以及网站的请求到达对的插件（样例在 `fixtures/`） |
| `fastify-route-options.test.mjs` | 写成对象的 Fastify 路由（`app.route({ method, url, handler })`）：方法列表、`schema` 里面的键放过、没写出来的 method 或 url 跳过、文件做出的任何名字的路由器、不是路由器的 `route()` 放过，以及网站的请求到达它们 |
| `nestjs.test.mjs` | NestJS：从 `@Controller` 和 `@Get` / `@Post`……装饰器来的接口，带完整路径和方法名；一个文件里好几个控制器和其他类；NestJS 文件以外的装饰器放过；网站的请求到达对的控制器；健康检查读 `@UseGuards`、`@Public()` 和整应用守卫（`APP_GUARD`、`useGlobalGuards`），只对 Nest 路由，以及必须不算的相似物（限流、下一个类上的守卫）（样例在 `fixtures/`） |
| `route-tables.test.mjs` | 写成数据的接口：`{ method, path, handle }` 对象，普通路径或正则（捕获变成参数、一组词展开、古怪的模式丢掉而不是放宽）、`Bun.serve({ routes })`、网站自己的请求名单放过（`action`、`resolve` 或 `fetch` 只在一个会提供服务的文件里才算）、Fastify 路由对象只算一次，以及健康检查仍去读表格旁边的 Express 路由（样例在 `fixtures/`） |
| `api-helpers.test.mjs` | 通过应用自己的帮手发出的请求（`apiGet('/tasks')`、`apiSend('PATCH', …)`）；客户端的基地址赢过同一台服务器上一个看起来更近的地址；这个基地址到达这个客户端的其他文件，但不到达同一个文件夹里的另一个应用 |
| `request-matching.test.mjs` | 地址里有一段要到运行时才填上的请求（`/api/users/${id}`）到达那里带参数的接口，而不是旁边一个写死的（`/api/users/stripe`）；调用方的基地址已知之后也这样；方法从地址下面几行的选项里读（测试自己写的一个 Next.js 样例应用） |
| `url-builders.test.mjs` | 地址由同一个类的方法拼出来的网页请求（Angular 服务），直接拼，或再经过另一个这样的方法；地址折到下一行的调用；建造者自己的模板、以及从未被请求的链接会留在外面；紧挨着建造者下一行的请求会留着 |
| `route-table-keys.test.mjs` | JavaScript 和 Python 里以 `"METHOD /path"` 为键的路由表：哪些表算、每条的处理函数、网站的请求到达它们，以及健康检查不对它们的登录检查发表意见（样例在 `fixtures/`） |
| `shopify-theme.test.mjs` | Shopify 主题：什么算一个主题、Liquid 标签、asset_url 和 JSON 模板按名字把文件连上、应用作为外面的包、模板作为页面、没有任何东西渲染或点名的片段、`NOT MAPPED` 算什么、主题以外的相似物放过，以及故意做成让读取变慢的 Liquid 文件 |
| `laravel.test.mjs` | PHP 和 Laravel：通过 composer 的 PSR-4 文件夹的 `use` 引用、在它们的组和周围路由文件下的路由、接口放在应答它的控制器方法里、Wayfinder 调用和 Inertia 页面连到它们的接口，以及健康检查读路由、组、控制器和表单请求上的检查（`fixtures/` 里的 Laravel + Inertia 样例） |
| `supabase-functions.test.mjs` | Supabase Edge Functions：`supabase/functions/` 下的每个文件夹是 `/functions/v1/<名字>` 上的一个接口（`Deno.serve`、标准库的 `serve()`、`export default { fetch }`）；里面的一个路由器（Hono）挪到 `/functions/v1` 下面；`_shared/` 和不是 `index` 的文件放过；网站的 `supabase.functions.invoke()` 调用和 `/functions/v1/` 请求到达它们；健康检查按每个函数自己的代码判断 |
| `php-pages.test.mjs` | 普通 PHP 站点：文档根（`public/`、`public_html/`、`www/`、`htdocs/`）下的每个脚本是它自己地址上的一个接口，`index.php` 在它所在文件夹的地址上；别的脚本 include 的脚本、`_` 和点开头的文件夹，以及框架的前门控制器（一个加载 Composer 自动加载器的 `index.php`）不是 |
| `firebase.test.mjs` | Firebase Cloud Functions：可调用函数和 onRequest 函数作为接口、网站对它们的调用、页面、健康检查、后台函数（`fixtures/` 里的 React + Firebase 样例） |
| `serverless.test.mjs` | Serverless Framework：`serverless.yml` 以及它用 `${file(...)}` 包含的文件里，`http` 和 `httpApi` 事件上的接口；短写法和长写法；每一个放进它的处理函数所在的文件（经过再导出，或进到包装函数把请求交给的那个函数）；网站的请求到达它们；健康检查读授权器、API 密钥和交给包装函数的检查（不是一个自己的名字听起来像检查的处理函数）；一个处理函数的每个地址各自判断；摘要里的后台函数；带 CloudFormation 标签、变量、锚点、垃圾、多余括号和很长的行的 YAML 读得快、不失败；测试文件夹里的样例配置和大到读不了的配置留在外面（样例在 `fixtures/`） |
| `blueprint.test.mjs` | 任何代码之前按 PRD 规划的地图：plan.json 的错误、接口和调用、页面、设计审查、刷新，以及换成真实代码（`fixtures/` 里的样例 PRD） |
| `blueprint-change.test.mjs` | 从地图改一张规划蓝图：助手更新后的计划被检查、保存并标出来，没通过检查时重试一次，以及撤销（`fixtures/fake-cli/` 里的替身命令行） |
| `byte-order-mark.test.mjs` | 开头带字节顺序标记的 JSON 文件（Windows PowerShell 就是这么写的）能像别的文件一样构建、刷新、描述、规划和导出；标记后面不是 JSON 的，仍然是一个点了名的错误 |
| `not-mapped.test.mjs` | 扫描和构建说出哪些种类的文件不在地图上、怎么加进去，跟着 `include` 走并计入 `ignore`；什么都画进去了就什么都不说 |
| `large-files.test.mjs` | 超过扫描大小上限的文件仍在地图上，带着行数；扫描、健康检查和地图会说它们没被读 |
| `sample-app.test.mjs` | 一个两个仓库的商店的整张地图：接口、跨仓库的请求、健康检查、离线地图、没有写下密钥的值、更新 |
| `worksheets.test.mjs` | 说明工作表引用每个接口的代码，以及很短的文件的全文，在它们的上限之内，密钥打码，`.env` 风格的文件从不引用，并列出引用、请求或点名每个文件的那些文件 |
| `plain-language.test.mjs` | 构建的警告，从不是错误：给所有人看的地图上，块的标签和摘要里的开发者用词（产品名和给开发者的地图放过；「hook」「component」这类页面用词只在它们指页面时才标；词表和写作指南保持同步；`--json` 的形状），以及自己文件夹里堆了很多文件的块 |
| `hostile-content.test.mjs` | 给不是你写的代码画地图：模型写的和扫描得来的每个字段里的敌意文字，留下一页，它的数据能解析并且来回一致（构建的、服务器送出的、导出的、导出按钮）；写进说明的密钥被打码，警告点名文件和字段，而散文、提交哈希和 UUID 留着；每一页的内容安全策略和它的脚本哈希对得上；不合法的模式是点了名的构建错误；配置文件和故意做成让模式匹配变慢的文件不让扫描卡住；看不见的和会倒序的字符显示成标记 |
| `serve.test.mjs` | 地图的服务器：只听 127.0.0.1、只用它自己的主机名、令牌和同源检查、不从它的文件夹以外提供文件 |
| `editor-links.test.mjs` | **在编辑器里打开**：默认 VS Code；在 `architecture.json` 里或地图服务器上点名或给出链接的编辑器；路径编码到不能把链接弄坏；每一个不是编辑器自己方案的设置（脚本、data、网址和 `file:` 链接、引号）被构建和服务器拒绝，页面也忽略 |
| `export.test.mjs` | 导出一份用来分享的副本：默认去掉什么、要了才加的那些、导出按钮的接口 |
| `phone.test.mjs` | 手机和平板的布局：顶栏折行而不是溢出、只剩图标的按钮仍有名字、44 像素的触摸目标、点一个框时打开的详情单、顶行的缩放按钮、折起来的说明，以及只在提问时显示的 AI 工具说明（查的是建好的页面，不是真的屏幕） |
| `ask.test.mjs` | 通过 Claude Code 或 Codex 提问：用哪一个、只读、追问、登录错误（`fixtures/fake-cli/` 里的替身命令行） |
| `agents.test.mjs` | 区分 Claude Code 和 Codex、各自构建的地图记下并写下什么，以及 open.mjs 给回答问题的那个程序起的名字（应答 `claude` 这个命令的另一个程序，按它自己的名字来叫） |
| `unattended.test.mjs` | 不在对话里跑：一个小驱动跟着 `workflow.json` 走完第一张地图和一次刷新，用准备好的答案，只用 `--json` 和退出码；可选的大白话那一步（改写了、放着没动、因为改的不止措辞而被拒绝，或失败了，地图每次都做完）；不往 `floorplan/` 以外写、地图不点名助手、git 失败会大声失败、工作流文件的名字和结构、`maskSecrets` 作为一个稳定导出，以及没有无人值守模式时什么都不变 |
| `read-only-install.test.mjs` | 文件只读的技能能把地图构建两次，它放在地图旁边的文件保持可写，包括盖掉早先版本留下的只读文件（在「只读也挡不住这个用户去写」的地方，它自己跳过） |
| `release.test.mjs` | 版本在两份插件的 `plugin.json`、README 徽章、更新日志和 `CHECKSUMS.txt` 之间一致 |
| `supply-chain.test.mjs` | 插件能做的事保持[装上安全吗？](is-it-safe.md)里说的那样：没有挂钩、没有 MCP 服务器、没有依赖、只有一个对外请求、固定的程序名单和预先批准的脚本、不在运行时加载代码、打包进来的排版引擎不变 |
| `touch.test.mjs` | 触摸手势：拖动跟着一根手指，触摸被取消时结束；两根手指捏合和平移；手势进行到一半不会重新适配地图（查的是建好的页面，不是真的屏幕） |
| `sandboxed.test.mjs` | 浏览器拒绝存储、剪贴板或新窗口的地图（沙箱框架、很严的设置）：这次访问的设置留在内存里、导览不自己开始、`#tour=0`、「已复制」只在真的复制了才说、窗口被拦时把地址显示出来，以及存储能用的地方什么都不变（页面自己的代码对着一个假装的浏览器跑，不是真的框架） |

样例项目由 `helpers.mjs` 写到临时文件夹（`shopApp()`），或从 `tests/fixtures/` 复制。任何看起来像密钥的东西都在运行时拼出来，所以从不把一把看起来像真的密钥提交进去。

你修的是 Floorplan 认错了的毛病时，加一个能看出它的样例，并确认没有你的修复时测试会失败。

## 扩展查看器

`skills/floorplan/assets/ui/` 里的文件按文件名顺序内联进每张地图。它们只通过 `window.Floorplan` 和查看器说话。它提供：

- 图和查询；
- 导航（`go`、`open`、`reveal`、`showBoard`、`playFlow`）；
- `addHeaderButton` 和 `addPanelSection('overview' | 'item', fn)`；
- `modal`、`toast`、`store`（这个浏览器的设置；浏览器不肯把它们留过这次访问时，`store.persistent` 为 false，于是改放在内存里）；
- `copy(text)`，只有文字真的复制了才解析为 true，否则把文字显示出来让人手动复制；以及 `openWindow(url)`，浏览器拦住新窗口时把地址显示出来。用这两个，不要用 `navigator.clipboard` 或 `window.open`，这样地图在沙箱框架里也行为一致；
- 事件（`on('ready' | 'render' | 'panel' | 'technical')`）；
- `exported`，在导出的副本里设置：那里需要 Claude、Codex 或地图服务器的东西，都去掉。

`20-health.js` 和 `25-recent.js` 是好例子。

## 加一个助手

有两份名单，一个助手可以在其中一份或两份上：

- **做这张地图的助手**，在 `scripts/lib/agent.mjs`：`DETECT` 里的一条，从它给自己跑的每条命令设置的变量认出它。地图记下它，所以提示会点对助手的名字。
- **回答问题的助手**，在 `assets/serve.mjs`：`ENGINES` 里的一条，带它的名字、去哪拿它、`find`（它的命令行在哪，加上一个 `--<名字> <路径>` 的覆盖）和 `run`（参数，以及怎么把它的输出读成进度和一份回答）。

一个引擎必须是只读的，而且是它的命令行强制的，不能只因为提示这么要求。做不到就在文档里明说。只有命令行把回答按结构交出来时才设 `structured: true`，因为从地图改规划蓝图靠这个；没有它，地图不提供改规划。运行哪条命令，绝不从页面或保存的设置里拿。往 `tests/fixtures/fake-cli/` 加一个替身命令行，以及像 `ask.test.mjs` 那样的测试。

## 约定

- **没有第三方依赖。** 脚本必须在任何有 Node 18 或更新的地方能跑，没什么要装的。
- **先用人话。** 地图上给人看的任何东西，应用的主人要能看懂，不能只有工程师看懂。
- **绝不保存或打印密钥的值。** 健康检查的发现记下密钥在哪和一条打码的提示，绝不记下值。
- **过程只描述一处。** `workflow.json` 描述和 SKILL.md 同一步骤，给不在对话里跑 Floorplan 用（[unattended.md](unattended.md)）。改了一边，就改另一边，并指向 `references/`，不要再抄一遍。
- **例子保持泛泛。** 代码注释、文档和提示不得描述任何真实的私人项目。

## 维护

### 分支和提交

- `main` 始终能发布。每个改动都通过它自己的分支到达 `main`，用合并提交合并（`git merge --no-ff`），这样每项改动在历史里读成一个整体。
- 分支按它是什么来起名，有议题号就带上：
  - `fix/4-fastapi-annotated-guards`
  - `feat/codex-support`
  - `docs/…`、`chore/…`

  用 GitHub 在议题上的 **Create a branch** 按钮做出的分支（`2-reaching-outside-repo`）也行。
- 提交说明以一句祈使的短摘要开头（「把排版引擎打包进来」），正文说为什么。
  - 提交或合并说明里的 `Fixes #N` 会在它到达 `main` 时关掉议题。这几个英文词是 GitHub 认的，不要译。
  - `Refs #N` 只链上，不关掉。
- **贡献者的拉取请求保留他们的提交和作者信息。** 用合并提交合并（「Merge pull request #N from user/branch」），`CHANGELOG.md` 冲突时两边的条目都留着。
- 合并之后删掉分支。

### 版本和更新日志

- 版本遵循[语义化版本](https://semver.org)。1.0 之前：
  - 补丁（0.1.x）给修复和小改进；
  - 次版本（0.x.0）给新功能，或任何会改变别人安装或运行的东西的改动。
- **只有版本变了，用户才会收到更新**，所以修复要及时发布，不要一直留在 `main` 上。
- 别人会注意到的每项改动，在 `CHANGELOG.md` 最上面的 `## Unreleased` 下加一行。这个英文标题是固定的：
  - 用大白话；
  - 署上报告或修复的人，例如「Reported by @name in #1, fixed by @name in #3」。这句署名的英文格式可以保留，好和已有条目一致；人名和议题号不要译。

### 发布

1. 在最新的 `main` 上跑测试，并检查清单，包括官方插件目录的要求：
   ```bash
   npm test
   claude plugin validate . --profile directory
   ```
2. 把 `.claude-plugin/plugin.json` 和 `.codex-plugin/plugin.json` 里的 `version` 抬上去，以及 `README.md` 里的版本徽章。徽章地址里的 `badge/version-0.11.0-` 这种片段必须还在，测试靠它认版本。
3. 把 `CHANGELOG.md` 里的 `## Unreleased` 改名为 `## X.Y.Z (YYYY-MM-DD)`。版本号、括号和日期这个格式不要改。
4. 版本抬上去之后，写下这次发布的指纹：
   ```bash
   node tools/checksums.mjs
   ```
5. 提交，说明写成 `Floorplan X.Y.Z: <一行标题>`，并推送 `main`。
6. 打标签并推送标签。这一步也会检查 `plugin.json` 和 marketplace 条目是否一致：
   ```bash
   claude plugin tag . -m "Floorplan %s" --push
   ```
7. 在 GitHub 上从标签（`floorplan--vX.Y.Z`）发布，标题是 `Floorplan X.Y.Z`，说明用更新日志里那一版的那一节。
8. 在这次发布修掉的每条议题和拉取请求上回复：改了什么、版本，以及怎么拿到（`claude plugin update floorplan@floorplan`）。中文版从 `Aondle/floorplan` 装，插件名仍是 `floorplan`。

### 议题和拉取请求

- 几天内回复新议题，哪怕只是说你看到了。
  - 给每一条贴标签（`bug`、`enhancement`、`question`）。这些英文标签名是 GitHub 上的固定名，不要译。
  - 你接手时把自己标成负责人。
- 问问题的形状，绝不问私人代码、密钥或私人地图的截图。
- 谢谢贡献者，并在更新日志和发布说明里署上他们。
- 关掉一条议题时，用评论点出含着这次修复的那次发布。
- 安全报告走 [SECURITY.md](../SECURITY.md)，私下进行。修复发布之前，不要在公开议题里讨论。
