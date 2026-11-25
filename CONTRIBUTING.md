# 参与 Floorplan

谢谢你来帮忙。问题报告、想法和拉取请求都欢迎。

本仓库是 [haydenschmitty/floorplan](https://github.com/haydenschmitty/floorplan) 的简体中文本土化副本，原作者是 [Hayden Smith](https://github.com/haydenschmitty)。中文文案的问题可以提在这份副本上。代码行为上的漏洞，仍按 [SECURITY.md](SECURITY.md) 私下报到上游。

## 报告一个毛病

[开一条议题](https://github.com/haydenschmitty/floorplan/issues/new/choose)，写上：

- 你对 Claude Code 或 Codex 说了什么，结果怎样；
- 它显示的输出，尤其是以 `✗` 或 `!` 开头的行；
- 你的项目用什么语言和框架，是一个仓库还是好几个；
- 你的系统和 Node 版本。

**请不要粘贴私有代码、密钥，或私人项目地图的截图。** 把问题的形状描述清楚，通常就够了。

安全问题走 [SECURITY.md](SECURITY.md)，不要发公开议题。

## 提一个想法

开一条议题，写你当时想做什么、什么挡住了你。用这个插件的人常常不是工程师，所以让地图对他们更清楚的想法尤其欢迎。

## 拉取请求

1. 先读[开发 Floorplan](docs/development.md)，看仓库怎么排、怎么试一份本地副本。
2. 从 `main` 拉分支，名字像 `fix/<议题号>-short-name` 或 `feat/short-name`，并在拉取请求里链上议题。
3. 改动收着点，并遵守那里的约定：
   - 不加第三方依赖；
   - 地图上给人看的话用大白话；
   - 绝不保存或打印密钥的值；
   - 例子保持泛泛的，不写真实的私人项目。
4. 至少在一个真实项目上试过你的改动，并在拉取请求里说是哪一类。如果你修的是 Floorplan 认错了的东西，往 `tests/` 加一个能看出问题的小样例。
5. 如果改的是别人会注意到的行为，在 `CHANGELOG.md` 最上面的 `## Unreleased` 标题下加一行。这个英文标题是发布流程认的固定字，不要译成别的。
6. 开拉取请求之前先跑：
   ```bash
   npm test
   claude plugin validate .
   ```

拉取请求按原有提交和作者信息合并，你会在更新日志和发布说明里被记上一笔。

参与即表示你同意自己的贡献按 [MIT 许可证](LICENSE) 授权。
