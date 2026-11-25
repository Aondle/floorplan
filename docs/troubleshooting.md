# 遇到问题

### 提问栏说它需要 Claude Code 命令行

地图开着，但没有办法提问。两种办法：

- 安装 [Claude Code 命令行](https://code.claude.com/docs/en/overview)，登录，然后让 Claude 更新 floorplan，或运行 `node floorplan/serve.mjs`；
- 或者在 Claude 应用里打开地图：让 Claude「把我的 floorplan 发到 Claude 应用」。那里的回答只来自地图。

### 命令行装了，但找不到

`serve.mjs` 在 PATH 和 `~/.local/bin` 里找 `claude`。它在别处：

```bash
node floorplan/serve.mjs --claude /path/to/claude
```

### Codex：提问栏说它需要 Codex

地图的服务器在 PATH 上找 `codex`，在 Windows 上还会找 Codex 桌面应用自带的命令行。安装 [Codex 命令行](https://developers.openai.com/codex/cli)，或把服务器指到你的那一份：

```bash
node floorplan/serve.mjs --codex /path/to/codex
```

如果它说 Codex 没登录，打开 Codex 应用（或运行 `codex login`），用 ChatGPT 登录。更多见[在 Codex 里用 Floorplan](codex.md)。

### Codex：地图没打开，或 Codex 打开之后提问就停了

Codex 把命令关在沙箱里跑，而地图的服务器需要一直留着，还要能上网。Codex 来问时，允许服务器在沙箱外面跑；或者你自己在项目文件夹里运行 `node floorplan/serve.mjs`。

### 提问失败，说 "Prompt is too long"

这句英文是程序报出来的，意思是提示太长，塞不进上下文。用 Claude Code 的话，先更新地图（`claude plugin update floorplan@floorplan`，再重建）：现在提问不再加载你的 MCP 服务器，以前是它们的工具说明把上下文填满了。MCP 是给 AI 接外部工具的一种插件。用 Codex 的话，你给 Codex 配的 MCP 服务器仍会加载，把用不到的关掉（在 `~/.codex/config.toml` 里那个服务器下面写 `enabled = false`）。

### 不认识 `node`

安装 [Node.js](https://nodejs.org) 18 或更新，然后新开一轮对话，让 Claude Code 或 Codex 认到它。

### Claude 或 Codex 老是问能不能跑 `node` 脚本

在 Claude Code 里，Floorplan 运行期间会预先批准它自己的脚本，但有些设置下它仍会问。选「这个项目始终允许」。Codex 按你的批准设置来问；把 Floorplan 的 `node` 脚本对这个项目允许掉，提示就会停。

### 技能不出现

插件在对话开始时加载，所以装完要新开一轮。看它是不是装了、开了：

```bash
claude plugin list
```

像「给我画一张 floorplan」这种普通请求，不用斜杠命令也能用。你要按名字叫它，是 `/floorplan:floorplan`。

在 Codex 里，看应用里的 **Plugins**，或运行 `codex plugin list`，装完新开一个聊天。要按名字叫它，输入 `$floorplan`。

### 地图看起来过时了

让 Claude 或 Codex「更新 floorplan」。如果标签页本来就开着，更新做完它会自己刷新。

### 地图是空白的，或卡在「正在排版…」

0.1.3 之前做的地图，排版引擎要从网上加载，所以查一下网络，或有没有内容拦截，或让 Claude「更新 floorplan」。较新的地图什么都做在里面，离线也能用。页面上那句「正在排版…」是程序里的固定字。

### 提问栏没有「改规划」开关

**改规划** 只出现在[规划蓝图](getting-started.md#plan-something-you-havent-built-yet)上，而且要通过它的服务器打开（`node floorplan/serve.mjs`），Claude Code 命令行或 Codex 还得可用。真实代码的地图没有这个开关：让 Claude Code 或 Codex 去改代码，再更新 floorplan。

### 改规划蓝图失败了，或者我不喜欢这次改动

更新后的计划试了第二次还过不了 Floorplan 的检查，就什么都不保存，地图保持原样；把要求说得更具体再试。改动已经生效但不是你要的，在它的小结里按 **撤销**，或再请一次改动。以前的版本留在 `floorplan/.cache/history/`。

### 少了一条连线

Floorplan 靠读代码找到大多数网页请求和引用，但不是全部，例如地址只存在于设置里的那些请求。让 Claude 把缺的连线加到 floorplan 上；它会记在 `architecture.json` 里，以后每次更新都还在。

### 文件在错误的一块里，或在 "Unassigned" 下面

"Unassigned" 是地图上那张卡片的固定英文名，意思是还没有归到任何一块的文件。让 Claude 把它挪走，或改 `floorplan/architecture.json` 里的 `paths` 匹配模式，再请一次更新。

### 地图上少了一个仓库，或扫描列出 PROBLEMS

`PROBLEMS` 是扫描打印出来的固定英文词。扫描会列出 git 没法列出文件的每个仓库，并给出大概的改法。常见原因：

- **没装 git**，或跑 Floorplan 的那个环境的 PATH 上没有它；
- **"dubious ownership"**：文件夹的主人是另一个用户时，git 会拒绝这份检出。容器和共享文件夹里很常见。用 `git config --global --add safe.directory <文件夹>` 把它标成安全的，再更新 floorplan。

如果你从自动检查或脚本跑 Floorplan，[无人值守模式](unattended.md)会把这些变成错误，这样缺了一个仓库的地图就混不过去。

### "floorplan/ already exists here and isn't a map"

这句英文是程序报出来的：你的项目自己有一个叫 `floorplan` 的文件夹，Floorplan 不会往里写。把你的文件夹改名，或让 Claude 把地图建到别处；扫描和构建脚本接受 `--out <文件夹>`。

### `git status` 显示 `floorplan/` 下面有文件

它们是在 Floorplan 开始忽略这个文件夹之前提交的。取消跟踪，磁盘上的文件留着：

```bash
git rm -r --cached floorplan
```

### 端口 4378 被占用

不用管。服务器会挪到下一个空端口。它打印出来的、或 Claude 给你的那个地址，才是对的。

### 停掉后台服务器

```bash
node floorplan/serve.mjs --stop
```

最后一个标签页关掉两小时后，它也会自己停。

### 还是卡住？

[开一条议题](https://github.com/haydenschmitty/floorplan/issues/new/choose)，写上你说了什么、发生了什么、用的是 Claude Code 还是 Codex，以及它显示的输出。请把代码里的私人内容留在外面。
