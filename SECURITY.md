# 安全政策

## 报告一个漏洞

请通过 GitHub 私下报告安全问题：打开仓库的 **Security** 标签页，选 **Report a vulnerability**。不要开公开议题。

上游仓库是 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan)。代码行为上的漏洞报到那里的 Security 页：<https://github.com/haydenschmitty/floorplan/security/advisories/new>。这份中文副本不代替上游接收安全报告。

写上这些会有帮助：

- 问题是什么，别人能拿它做什么；
- 怎么重现；
- 你用的 Floorplan 是哪个版本（看 `.claude-plugin/plugin.json`）。

几天内会有回复。修复发布之后，除非你不想，否则会署上你的名字。

## 这个插件能做什么

[装上安全吗？](docs/is-it-safe.md) 列出 Floorplan 在你电脑上做的每一件事：它唯一对外的请求、它会启动的每个程序，以及它绝不做的事。[`tests/supply-chain.test.mjs`](tests/supply-chain.test.mjs) 在每次推送和每个拉取请求上盯着这些。每次发布的 `CHECKSUMS.txt` 让你核对装到的那一份是不是对得上（`node tools/checksums.mjs --check <文件夹>`）。

## 范围

算在里面的：

- 地图的本地服务器（`serve.mjs`）；
- 任何可能泄露密钥或源代码的事；
- 任何写到项目的 `floorplan/` 文件夹和 `CLAUDE.local.md` 以外的事。

不算在里面的：Claude Code 本身的问题，报到 [Anthropic](https://www.anthropic.com/responsible-disclosure-policy)；Codex 本身的问题，报到 [OpenAI](https://help.openai.com/en/articles/6653653-how-to-report-security-vulnerabilities-to-openai)。

## 哪些版本还修

只有最新的发布会收到安全修复。
