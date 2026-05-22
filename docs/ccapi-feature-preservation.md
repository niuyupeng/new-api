# ccapi Feature Preservation Rules

ccapi is built on top of New API. Product polish must be additive: keep the original gateway, billing, channel, model, user, log, and system-management workflows available while adding ccapi-specific brand and chat surfaces.

## What Must Never Disappear

- Public navigation: 首页, 模型广场, 文档, 控制台首页, 关于.
- Brand assets: `web/default/public/logo.png`, `web/default/public/logo-dark.png`, `web/default/public/favicon.ico`.
- User console entries: 钱包, API Keys, 使用日志, 任务日志, 本地设置.
- Admin entries: 渠道, 模型, 用户, 兑换码, 订阅管理, 系统设置.
- Wallet flows: external recharge link, online top-up when enabled, redemption-code input, order history.
- API key flows: create key, view/mask key, copy key, copy connection info.
- Channel flows: add/edit channel, model mapping editor, fetch models from upstream when supported.
- Model/pricing pages: search, filter, card/table view, token-unit display, recharge price mode.
- Docs page: concise copyable instructions for OpenAI-compatible SDKs, Claude Code, Codex, Cursor, and CC Switch.

## Why Missing Features Happened

The earlier ccapi work replaced several public surfaces with branded minimal pages and then had to restore NewAPI console links afterward. That approach made parts of the product look cleaner but also made real gateway features feel hidden. Future work should wrap or extend existing NewAPI features instead of replacing them.

## Required Checks Before Commit Or Deploy

Run these from `web/default` after frontend changes:

```bash
bun run typecheck
bun run theme:check
bun run regression:check
bun run build
```

For local backend preview, rebuild the Go binary after `bun run build`, because the frontend bundle is embedded:

```bash
go build -o /tmp/ccapi-local-new-api main.go
tmux kill-session -t ccapi-local 2>/dev/null || true
tmux new-session -d -s ccapi-local 'cd /Users/niuyupeng/newapi/new-api-source && /tmp/ccapi-local-new-api > /tmp/ccapi-local-3000.log 2>&1'
```

Then inspect `http://127.0.0.1:3000/`, not a frontend-only preview port.
