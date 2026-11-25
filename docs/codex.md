# 在 Codex 里用 Floorplan

Floorplan 在 [Codex](https://developers.openai.com/codex) 里和在 Claude Code 里是同一套：同一个技能、同一批脚本、同一张地图，用的是你自己的 ChatGPT 登录。不用另外配 API 密钥。

## 你需要什么

- Codex：桌面应用或命令行，用你的 ChatGPT 账号登录。
- [Node.js](https://nodejs.org) 18 或更新。

<a id="install"></a>

## 安装

**在 Codex 应用里**（不用终端）：

1. 打开 **Plugins**，选 **Add a marketplace**。
2. **Source** 填 `Aondle/floorplan`。**Git ref** 留空，点 **Add marketplace**。
3. 在列表里找到 **Floorplan**，点 **+** 安装。
4. 新开一个聊天。

这是中文版。上游 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 是出处，从那里装到的是英文原版。插件名仍是 `floorplan`。

**在终端里**，用 [Codex 命令行](https://developers.openai.com/codex/cli)：

```bash
codex plugin marketplace add Aondle/floorplan
codex plugin add floorplan@floorplan
```

应用和命令行共用插件，在一边装好，另一边也能用。

## 做第一张地图

用 Codex 打开你的项目，用大白话说：

> 给这个代码库画一张 floorplan

要按名字调用这个技能，输入 `$floorplan`。后面就和 Claude Code 一样（[上手](getting-started.md#make-your-first-map)）：Codex 扫描代码，给每一块、每个文件和每个网页请求写说明，建好地图并打开它。之后说「更新 floorplan」，只会重读有变化的部分。

Codex 打开地图时，会问能不能在沙箱外面跑地图的服务器。服务器得在命令结束后还留着，提问栏也得够得到 Codex。如果你不想允许，就自己在项目文件夹里跑：

```bash
node floorplan/serve.mjs
```

## 在地图上提问

地图的提问栏在你的电脑上跑你自己的 Codex：在项目文件夹里用你的 ChatGPT 登录，执行 `codex exec`，关在 Codex 的**只读**沙箱里。它读地图和你的源代码来回答，不能改任何文件。这些运行不会写进你的 Codex 历史；追问时，它会把最近几问几答带上。

服务器用的是做这张地图的那个助手。那个没装时，就退到另一个。要自己指定：

```bash
node floorplan/serve.mjs --engine codex
```

它在 PATH 上找 `codex`，在 Windows 上也会找 Codex 桌面应用自带的命令行。你的装在别处，就传 `--codex /path/to/codex`。`--model <名字>` 指定模型；不写的话，按你的 Codex 设置来。

## 和 Claude Code 有什么不同

- **没有笔记文件。** 在 Claude Code 里，Floorplan 可以在 `CLAUDE.local.md` 里留一小段笔记（私人的、从不提交，而且只有你点头才写），让以后的对话知道地图在哪。Codex 没有这种私人的、不提交的对应物（`AGENTS.md` 是跟团队共享的），所以在 Codex 里 Floorplan 不动你项目的笔记。
- **没有 Claude 应用。** 把地图发到 Claude 应用是 Claude 的功能。在 Codex 里，地图在你的浏览器里打开，由你的电脑提供。
- **「让 Codex 来改」。** 健康检查面板上现成的修复请求，是贴进 Codex 用的。在[规划蓝图](getting-started.md#plan-something-you-havent-built-yet)上，**让 Codex 来做** 也一样。提问栏的 **改规划** 开关同样在只读沙箱里跑 Codex：Codex 回复更新后的计划，地图的服务器负责保存。

<a id="update-or-remove-it"></a>

## 更新或卸掉

在应用里打开 **Plugins**，找到 Floorplan 这个来源，选 **Upgrade** 拿最新版，或选 **Remove marketplace** 把它去掉。在终端里：

```bash
codex plugin marketplace upgrade floorplan
codex plugin add floorplan@floorplan
```

```bash
codex plugin remove floorplan@floorplan
codex plugin marketplace remove floorplan
```

各地图还在各自项目的 `floorplan/` 文件夹里，直到你自己删。

<a id="trying-a-working-copy"></a>

## 试用手头这份副本

让 Codex 指向你本地的克隆，而不是 GitHub：

```bash
codex plugin marketplace add /path/to/floorplan
codex plugin add floorplan@floorplan
```

你加一个本地插件时，Codex 会把它复制进自己的缓存（Claude Code 不一样，它直接从那个文件夹跑）。你改完插件之后，再跑一次 `codex plugin add floorplan@floorplan`，并新开一轮对话。
