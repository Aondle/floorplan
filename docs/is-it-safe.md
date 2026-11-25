# 装上安全吗？

Claude Code 和 Codex 的插件能在你的电脑上跑代码，所以值得问一句。有些恶意插件装的时候看起来无害，过后才下载并运行别的东西（所谓「第二阶段」）。Floorplan 做成做不到那一步，每次改动都有测试盯着，你也可以自己把这些全部核对一遍。

## Floorplan 绝不做的事

- **没有挂钩。** 挂钩（hooks）会在每一轮对话的事件上自动跑代码，所以常被拿来藏东西。Floorplan 一个都没有。
- **没有 MCP 服务器。** MCP 是给 AI 接外部工具的一种插件。Floorplan 没有，所以它不会启动一个服务器，再用 `npx` 去下载自己的最新版。
- **没有第三方依赖，没有安装脚本。** 安装时不会从 npm 拿任何东西，以后也不会。它的 `package.json` 只为了跑测试。
- **从不下载任何东西，也从不运行网上来的代码。** 没有 `eval`，没有在运行时加载代码，没有编码过的载荷。
- **从不改你的代码。** 它只写自己的 `floorplan/` 文件夹；在 Claude Code 里，而且只有你点头，才会改 `CLAUDE.local.md` 里标好的一段。见[项目里有什么](project-files.md)。
- **没有统计，也没有追踪。**

## 它实际做的每一件事

<a id="the-network"></a>

### 网络

- **地图的服务器**（`floorplan/serve.mjs`）只听 `127.0.0.1`，别的机器够不着。它只应答打到自己这个端口上的 `127.0.0.1` 和 `localhost`。它的接口需要一个令牌，只有地图页面拿得到。
- **唯一对外的请求：Floorplan Cloud 候补名单。** 只有你在地图上的卡片里填了邮箱并点下去报名，才会发出去。它发到 `floorplan-waitlist-690500262396.us-central1.run.app`，带上你的邮箱，以及「就我自己」还是「和团队一起」。程序发出去的字段是 `solo` 或 `team`，不是这两句中文。细节见[隐私与安全](privacy-and-security.md#floorplan-cloud-waitlist)。
- **地图页面不从网上加载任何东西。** 排版引擎和字体都做在文件里。它只链到文档，你点了才打开。
- **页面自己把这件事钉死。** 每张地图都带一份内容安全策略（Content-Security-Policy，告诉浏览器这页允许加载什么）：只有这页自己的脚本能跑（每个脚本靠写入页面时算出的 SHA-256 哈希放行），图片和字体只能来自文件内部。**导出的副本**什么都不能联系（`connect-src 'none'`）。`floorplan/index.html` 和地图服务器送出的那一页，只能联系那个本地服务器（`connect-src 'self'`），用来提问、即时刷新、流程和导出。所以就算仓库里的某段文字绕过了地图的转义、变成了脚本，它也没法把地图发到别处。给 Claude 应用做的那份副本（`--artifact`）自己不带这份策略，因为 Claude 应用会在那一页里跑自己的代码，并套自己的规则。
- **报告误报，由你自己发送。** 如果你在健康检查的 **不是问题** 下面勾了那一格，地图会在你的浏览器里打开一条填好字的新 GitHub 议题，并先给你看。你不在那里提交，什么都不会发出去。

在地图上提问，跑的是 Claude Code 或 Codex。它们按平时的方式跟 Anthropic 或 OpenAI 说话，用的是你的账号。Floorplan 自己什么都不发。

### 它会启动的程序

| 程序 | 什么时候 | 为什么 |
|---|---|---|
| `git` | 扫描 | 只读：哪些文件被跟踪、当前分支和提交、上次地图之后改了什么 |
| `where`（Windows）或 `which` | 启动地图服务器时 | 找 Claude Code 或 Codex 的命令行 |
| `claude` 或 `codex` | 你在地图上提问时 | 回答问题，只读：`claude -p` 只限于读文件和 Floorplan 的查询脚本，或 `codex exec --sandbox read-only` |
| `node` | 从头到尾 | 跑 Floorplan 自己的脚本 |
| `cmd /c start`、`open` 或 `xdg-open` | 打开地图时 | 在浏览器里打开地图的本地地址 |

每一个都是带着参数直接启动的，从不拼成一行交给外壳去解释。唯一用到外壳的是 Windows 的 `cmd /c start`，而且只把地图自己的本地地址交给它。

### 不问你就跑的

在 Claude Code 里，这个技能正在用的时候，它预先批准一种命令：`node` 跑它自己的脚本，而且每个都写死了名字（`scripts/build.mjs`、`describe.mjs`、`open.mjs`、`plan.mjs`、`recent.mjs`、`refresh.mjs`、`scan.mjs` 和 `status.mjs`）。这份名单由下面的测试钉死。Claude 做的其他事，仍按你的权限设置来问，跟平时一样。Codex 按你的批准设置来问。

### 工作流文件

`skills/floorplan/workflow.json` 是数据，不是代码：和 SKILL.md 同一套步骤，给那些用自己的脚本或自动检查来跑 Floorplan 的人用（[不在对话里跑](unattended.md)）。Floorplan 里没有任何东西读它来决定要跑什么。

### 三件值得说明的事

- **`skills/floorplan/assets/vendor/elk.bundled.js`** 是一个 1.6 MB 的压缩文件：给地图排版的引擎。它是 [elkjs](https://github.com/kieler/elkjs) 0.9.3，和 npm 上的官方包逐字节相同。它的 SHA-256 是 `b0745abd7f23cd91690a1587e377edbe19fd7233c783300290936720546216d4`。你自己核对：
  ```bash
  npm pack elkjs@0.9.3
  tar -xzf elkjs-0.9.3.tgz package/lib/elk.bundled.js
  ```
  然后把 `package/lib/elk.bundled.js` 和 Floorplan 这份比，例如用 `sha256sum`（macOS 用 `shasum -a 256`；Windows PowerShell 用 `Get-FileHash`）。
- **`serve.mjs` 里有一处 `new Function`**，用来加载 `floorplan/query.mjs` 里地图的查询代码。那个文件是 Floorplan 的构建写进你项目的。它从不运行网上来的任何东西。
- **健康检查会读它找到的令牌的中间一段**（从 base64 解出来），用来判断每种令牌是什么，从而跳过那些本来就该公开的。它从不保存、也不显示令牌本身。

## 每次改动都查

[`tests/supply-chain.test.mjs`](../tests/supply-chain.test.mjs) 在每次推送和每个拉取请求上跑，Linux 和 Windows 都跑（macOS 每周一次）。一次改动只要会做下面的事，测试就失败：

- 加上挂钩、MCP 服务器、依赖或安装脚本；
- 往地图自己的服务器和候补名单以外的任何地方发请求；
- 启动上表里没有的程序，或通过外壳启动一个程序；
- 使用 `eval`、在运行时加载代码，或在代码里藏一长串编码过的字符串；
- 加一个不问你就跑的脚本；
- 改掉打包进来的排版引擎，或再塞一个厂商文件。

每一项都试过：故意种下恰好那种改动，看测试失败。这些里的任何改动，都必须同时改测试和这一页，而且公开做。

在你自己的副本上跑同一套检查：

```bash
node --test tests/supply-chain.test.mjs
```

## 核对你装到的是不是一次真实发布

每次发布都带 `CHECKSUMS.txt`：插件实际会跑的每个文件的 SHA-256 指纹（技能、插件清单、marketplace 文件）。把你装到的那一份和 GitHub 上的发布比：

```bash
git clone --depth 1 --branch floorplan--v<version> https://github.com/Aondle/floorplan floorplan-check
node floorplan-check/tools/checksums.mjs --check <已安装的文件夹>
```

`<version>` 是你装的版本（`claude plugin list` 或 `codex plugin list` 能看到）。已安装的文件夹是：

- **Claude Code：** `~/.claude/plugins/cache/floorplan/floorplan/<version>`
- **Codex：** `~/.codex/plugins/cache/floorplan/floorplan/<version>`

它会打印：要么全部文件一致，要么哪些变了、多了或少了。

这份命令对的是中文版 `Aondle/floorplan`。上游 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 是出处；拿上游的指纹来对这份中文安装，会对不上，因为技能说明和界面文案做了汉化，不是文件被换掉了。标签名仍是 `floorplan--v<版本号>`。

## 老实说做不到的

- Claude Code 和 Codex 从插件的仓库安装，更新会带上最新发布里的一切。这个插件如此，别的插件也如此。发布只由维护者做，`main` 受保护：历史不能被改写或删掉。外面来的拉取请求，跑起来或合并之前都会先审，上面这些检查在每一条上都跑。更新之前，你可以先读[更新日志](../CHANGELOG.md)里的改动，再用指纹核对新版本。
- Floorplan 的做法是让 Claude 或 Codex 读你的代码来描述它。那会按你的账号送到 Anthropic 或 OpenAI，和你交给它们的其他任务一样。见[隐私与安全](privacy-and-security.md)。

## 发现了什么？

请私下报告，按[安全政策](../SECURITY.md)里写的做。
