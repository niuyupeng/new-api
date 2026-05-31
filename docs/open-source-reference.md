# ccapi 前端开源参考记录

本轮没有直接复制任何开源项目代码、品牌、Logo 或文案，只参考产品结构、交互模式和接入说明方式。

## 参考项目对比

| 项目 | GitHub | License | 技术栈 | OpenAI-compatible Base URL | 流式聊天 | 生图 | 是否适合直接 fork | 借鉴点 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NextChat / ChatGPT-Next-Web | https://github.com/ChatGPTNextWeb/NextChat | MIT | Next.js、React、Tauri | 支持 `BASE_URL` 覆盖 OpenAI 请求地址 | 支持 | 不是主线重点 | 适合轻量聊天客户端，不适合直接变成 ccapi 官网 | 本地会话、模型选择、快速部署、轻量输入体验 |
| LibreChat | https://github.com/danny-avila/LibreChat | MIT | MERN、Express、React、MongoDB | 支持 custom endpoints 和 OpenAI-compatible 配置 | 支持 | 支持 OpenAI Image Tools | 功能强但偏重，不适合直接套整站 | 自定义 endpoint、Agent/工具、图像工具、企业化设置 |
| Open WebUI | https://github.com/open-webui/open-webui | Open WebUI License / 多许可证 | Svelte、Python、FastAPI | 支持 OpenAI API Base URL / 多连接 | 支持 | 支持 OpenAI、ComfyUI、Automatic1111、Gemini 等引擎 | License 和品牌保留要求较强，不适合直接 fork 做 ccapi | 管理后台、连接配置、图像生成设置、模型中心组织方式 |
| LobeChat / LobeHub | https://github.com/lobehub/lobe-chat（当前生态逐步迁移到 LobeHub） | LobeHub Community License | Next.js、React、Ant Design / lobe-ui、Zustand | 支持多 provider 与 OpenAI 代理配置 | 支持 | 支持多模态/图片相关能力 | 视觉和系统很强，但 License 与产品形态不适合直接复制 | Provider 组织、模型选择器、现代工作台密度、插件化思路 |
| Niek ChatGPT Web | https://github.com/Niek/chatgpt-web | GPL-3.0 | Svelte、Vite、Tauri | 支持 API base / endpoint 配置 | 支持基础聊天 | 有 DALL-E 触发能力 | GPL 不适合闭源商业 fork，只适合参考极简结构 | 简洁输入、单页 demo、本地存储、低心智成本 |

## 最终采用路线

1. **不 fork Open WebUI / LibreChat / LobeChat 整站**：它们会把 ccapi 变成另一个产品，且 Open WebUI、LobeChat 的许可和品牌要求不适合直接商用套壳。
2. **保留 New API 自身架构**：继续使用 `web/default` 的 React 19 + TypeScript + Rsbuild + Tailwind + Radix UI，这样能直接接入现有登录、余额、模型、价格、Key、日志和后台。
3. **吸收交互，不复制视觉**：
   - NextChat：本地会话、快速模型切换、轻量输入。
   - LibreChat：OpenAI-compatible custom endpoint 文档和图像能力说明。
   - Open WebUI：健康检查、模型/图像配置的后台思路。
   - LobeChat：右侧模型参数面板和现代工作台密度。
4. **品牌独立**：采用 “模型补给舱 / Developer dock” 隐喻，颜色以深墨、暖橙、冷青为主，不使用 BeefAPI、Open WebUI、LobeChat 等项目的名称、梗、Logo 或品牌视觉。

## 设计决策

- ccapi 前端优先服务两类人：
  - 普通用户：直接聊天、生图、查看余额。
  - 开发者：复制 Base URL / API Key，把 Claude Code、Codex、Cursor、Continue 等工具接起来。
- API 形态沿用 New API / OpenAI-compatible：
  - 聊天：`/v1/chat/completions` 或站内 `/pg/chat/completions`。
  - 生图：`/v1/images/generations`。
  - 模型：`/v1/models`、控制台模型/价格数据。
- 安全策略：
  - README 和示例只使用 `sk-your-api-key`。
  - 本地设置页不保存测试 API Key，避免把调试密钥误当作生产配置。
  - 客户 Key 由登录、充值、控制台 API 密钥流程生成和管理。
  - 服务端真实渠道 Key 继续由 New API 后台管理，不在前端暴露。
