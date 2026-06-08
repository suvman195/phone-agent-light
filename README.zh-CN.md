# Phone Agent Light 中文安装指南

把一台旧安卓手机变成本地 AI Agent 状态屏。Mac 负责运行服务，安卓手机只负责打开显示页。

## 截图

| 手机横屏显示 | 手机竖屏显示 | 后台控制面板 |
| --- | --- | --- |
| ![手机横屏显示](docs/product-display.jpg) | ![手机竖屏显示](docs/product-display-2.jpg) | ![后台控制面板](docs/control-panel.png) |

## 适合谁

你需要：

- 一台 Mac
- 一台安卓手机
- 两台设备在同一个 Wi-Fi 下
- Mac 上安装 Node.js 18 或更新版本

不需要先配置 API key。没有 API key 时，项目会自动进入演示模式。

## 最快安装方式

```bash
git clone <repo-url>
cd phone-agent-light
npm run setup
npm start
```

`npm run setup` 会自动生成 `.env`，并打印两个地址：

- `Control panel`：在 Mac 浏览器里打开
- `Phone display page`：在安卓手机浏览器里打开

手机打开 `Phone display page` 后，如果能看到状态屏，基础安装就完成了。

## 检查环境

```bash
npm run doctor
```

这个命令会检查：

- Node.js 和 npm 是否可用
- `.env` 是否存在
- 服务是否已经启动
- 构建安卓全屏壳所需的 Java / Android SDK 是否准备好

注意：安卓 SDK 只影响 APK 构建。浏览器模式不需要安卓 SDK。

## 手机上怎么用

最简单方式：直接用安卓手机浏览器打开 `npm run setup` 打印出来的手机页面地址。

如果想要全屏、常亮、无地址栏，可以构建安卓 WebView 壳：

```bash
npm run android:build
```

生成的 APK 在：

```text
android-shell/dist/phone-focus-shell.apk
```

把这个 APK 安装到安卓手机上即可。

## 配置 AI

编辑 `.env`：

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

把你的 key 填到 `OPENAI_API_KEY` 后面即可。如果不填，系统会继续使用演示模式。

## 可选：接入本机 Agent 状态

默认不会读取你的本机会话或日志。如果你明确需要，可以在 `.env` 中开启：

```env
ENABLE_HERMES_BINDING=1
ENABLE_CODEX_BINDING=1
```

这些绑定会读取 `~/.hermes` 或 `~/.codex/sessions` 下的本机文件，里面可能有私密提示词、路径和工具输出。开源给朋友使用时，建议默认保持关闭。

## 安全提醒

- 只建议在可信局域网使用
- 不要把服务直接暴露到公网
- 不要提交 `.env`、API key、APK、keystore、日志、截图和本机会话文件
- 如果 Mac 的局域网 IP 变化，重新运行 `npm run setup`
