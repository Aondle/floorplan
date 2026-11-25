# Floorplan 文档

本项目基于 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 进行中文本土化适配，原作者是 [Hayden Smith](https://github.com/haydenschmitty)。

| 指南 | 里面有什么 |
|---|---|
| [上手](getting-started.md) | 安装、做第一张地图、保持更新、代码还没有时先做规划、更新和卸掉插件 |
| [在 Codex 里用](codex.md) | 在 Codex 里安装和使用 Floorplan，以及和 Claude Code 有什么不同 |
| [用地图](using-the-map.md) | 每个按钮、每种看法、侧栏、快捷键和右键菜单，以及规划蓝图多出来的东西 |
| [它怎么干活](how-it-works.md) | 从扫描到地图的流水线、连线怎么找到、更新为什么省、规划蓝图怎么画、怎么改 |
| [项目里有什么](project-files.md) | Floorplan 创建的每个文件、哪些你可以改、它怎么躲开 git |
| [隐私与安全](privacy-and-security.md) | 什么在哪跑、什么会离开你的电脑、密钥怎么处理 |
| [装上安全吗？](is-it-safe.md) | Floorplan 在你电脑上做的每一件事、测试怎么盯着、怎么核对你装到的那一份 |
| [遇到问题](troubleshooting.md) | 常见问题以及怎么改 |
| [不在对话里跑](unattended.md) | 在自动检查、脚本或你自己的工具里跑：无人值守模式、结果用 JSON、退出码、工作流文件 |
| [开发 Floorplan](development.md) | 仓库怎么排、试一份本地副本、发布新版本 |

刚来？从[上手](getting-started.md)开始。

这些指南里的命令是按 POSIX 外壳写的（macOS 和 Linux 的终端，Windows 上的 Git Bash 或 WSL）。大多数是普通的 `node …` 或 `claude …`，在 Windows PowerShell 里也一样，路径加上引号即可。不一样的地方：这一轮要设变量时，用 `$env:FLOORPLAN_UNATTENDED = "1"`，不要用 `export FLOORPLAN_UNATTENDED=1`；先 `$S = "C:\path\to\floorplan\skills\floorplan"`，再用 `$S`，不要写 `S=…`；两条命令接着用 `;`（第一条失败就停，写成 `a; if ($?) { b }`），不要用 `&&`。

Floorplan 主要是给已经有的代码画地图，每份指南都按这个来写。它也可以画一张**规划蓝图**：代码还没有时，按 PRD 或规格规划出来的地图。见[还没写代码，先画一张规划](getting-started.md#plan-something-you-havent-built-yet)、[地图上的规划蓝图](using-the-map.md#blueprints) 和[规划蓝图怎么做](how-it-works.md#blueprints)。
