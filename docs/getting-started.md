# 上手

想先看？[演示视频](https://youtu.be/NTUUzC7L_NQ) 讲了怎么安装 Floorplan，以及怎么逛一张做好的地图。视频是上游原作者的。

Floorplan 能在 **Claude Code** 和 **Codex** 里用。做地图、用地图两边一样，只有安装不一样。这份指南写 Claude Code，Codex 的步骤在[在 Codex 里用 Floorplan](codex.md)。

## 你需要什么

- **Claude Code**（Claude 桌面应用里的 Code 标签页，或终端里的 Claude Code 命令行），或者 **Codex**（应用或命令行，用 ChatGPT 登录）。
- **[Node.js](https://nodejs.org) 18 或更新。** Floorplan 的脚本靠它跑。用 `node --version` 看版本。
- **用 Claude Code 时，建议再装 [Claude Code 命令行](https://code.claude.com/docs/en/overview)**，哪怕你主要用桌面应用。有了它，地图的提问栏回答时才能去读你的真实代码。Codex 不用额外装：它的应用已经带了提问栏要用的东西。

## 安装

**在 Codex 里**，打开 **Plugins → Add a marketplace**，填 `Aondle/floorplan`，再安装 Floorplan。细节见[在 Codex 里用 Floorplan](codex.md#install)。这是中文版。上游 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 是出处，从那里装到的是英文原版。

**在 Claude Code 里**，在任意终端跑一次这两行：

```bash
claude plugin marketplace add Aondle/floorplan
claude plugin install floorplan@floorplan
```

第一行把这份仓库登记成插件来源。第二行给所有项目装上 Floorplan，插件名仍是 `floorplan`。桌面应用和命令行共用同一套设置，所以两边都会出现。

装完**新开一轮对话**。插件是在对话开始时加载的。

> 在 Claude 桌面应用里，也可以用输入框旁边的 **+**（**Add plugins**，或 **Plugins → Browse plugins**）浏览插件。它列出的是你已经加过的来源里的插件。

<a id="make-your-first-map"></a>

## 做第一张地图

1. **打开你的项目。** 在 Claude 桌面应用的 Code 标签页，发第一条消息之前，先在输入框下面那一行选好项目文件夹。在 Codex 应用里，打开项目文件夹。在终端里，从项目文件夹运行 `claude` 或 `codex`。

   如果应用拆在几个仓库里（比如并排的 `web/` 和 `api/`），打开那个把它们都放在里面的文件夹。Floorplan 会一起画，并把它们之间的请求连上。

2. **说一声：**

   > 给这个应用画一张 floorplan。

   在 Claude Code 里也可以从 **/** 菜单选 **floorplan**，或输入 `/floorplan:floorplan`。在 Codex 里输入 `$floorplan`。

3. **让它干活。** 会发生这些事：
   - 一次扫描列出每个文件、每处引用、每个接口和每个网页请求。这只要几秒，不花 AI 用量（token，按读了多少字计的那部分）。
   - Claude 或 Codex 读你的 README、配置和入口，然后判断应用有哪些主要部分、每一块是干什么的。
   - 它给每个文件和每个接口写一个人话名字和一句说明。在 Claude Code 里，文件大约超过 150 个时，会拆给几个帮手并行做。
   - 地图建好并检查：连线、健康检查里的问题、页面。

   小应用几分钟，大的更久。它可能会问能不能跑 Floorplan 的脚本（`node …`），允许即可。Codex 还会问能不能在沙箱外面启动地图的服务器（沙箱是把它关起来、不让乱改文件的盒子）。允许之后，地图才能一直开着，提问栏也才能找到 Codex。

4. **逛一逛。** 地图会自己打开，在应用的浏览器窗格或你的网页浏览器里。第一次会跑一分钟的 **新手导览**。回复会用几句话讲你的应用是怎么拼的，并点出健康检查里要紧的事。

地图上能做的每件事，见[用地图](using-the-map.md)。

## 保持更新

你或你的 AI 改过代码之后：

> 更新 floorplan。

Floorplan 会重新扫描，并跟上一次的地图比。挪过位置的文件留着原来的说明，删掉的会消失，只有新的、或用途变了的才会重写。浏览器里已经打开的地图会自己刷新，刚改过的卡片在 **最近改动** 里亮成绿色。

<a id="plan-something-you-havent-built-yet"></a>

## 还没写代码，先画一张规划

上面说的是 Floorplan 的本职：给已经存在的代码画地图。它还有第二个用途，给还没有代码的时候：按 PRD、规格或一段「我想做什么」的描述，画出一张应用的**规划蓝图**。打开你准备在里面做的文件夹（空的也行），把文档给它，然后说：

> 这是我的 PRD。画一张 floorplan，看看我们要做些什么。

你会得到一张**规划蓝图**：同一张地图，标出应用需要的每一块、每个文件、每个接口和每个页面，它们怎么连，以及它们靠哪些外面的服务。卡片是虚线，好让你看出这还是计划。回复会说出 Claude 或 Codex 选了哪套技术、它假定了什么，以及你的 PRD 还没回答的问题。

在地图上：

- **设计审查** 列出计划还得定的事，比如谁都能用的接口，或还没回答的问题。**在地图上处理** 用来定一条：如果是个问题，你只要把答案打进去。
- 把提问栏拨到 **改规划**，就能改计划（「把退款也规划进去」）。地图会重画，改过的地方会标出来，**撤销** 可以改回去。
- 每一块都有 **让 Claude 来做**（或 Codex），一段只做这一块的现成请求。

代码写出来之后，对 Claude 或 Codex 说「现在改画真实代码」，蓝图就变成普通地图。怎么做的，见[规划蓝图](how-it-works.md#blueprints)。

## 自己打开地图

地图是项目里的一个文件夹。两种开法：

```bash
node floorplan/serve.mjs
```

会在 http://127.0.0.1:4378 把它开出来，提问栏能用。或者双击 `floorplan/index.html`，除了提问，别的都能用。

替你打开地图时，服务器在后台跑，你关掉最后一个标签页两小时后它自己停。想早点停：

```bash
node floorplan/serve.mjs --stop
```

## 更新插件

Codex 见[更新或卸掉](codex.md#update-or-remove-it)。

在 Claude Code 里，从 GitHub 装的插件不会自动更新，除非你打开那个开关。要拿到最新版：

```bash
claude plugin update floorplan@floorplan
```

或者打开自动更新：在一轮 Claude Code 对话里运行 `/plugin`，打开 **Marketplaces**，选 **Enable auto-update**。两种办法都是下一轮对话才生效。改了什么见[更新日志](../CHANGELOG.md)。

## 卸掉它

```bash
claude plugin uninstall floorplan@floorplan
```

Codex 见[更新或卸掉](codex.md#update-or-remove-it)。然后，在用过它的每个项目里删掉 `floorplan/` 文件夹（如果用过 Claude Code，再删掉 `CLAUDE.local.md` 里 Floorplan 那一段）。
