# dsh-effort-lock

> 个人自用插件，代码和文档由 AI 参与编写，不承诺维护。使用前请先备份 DSH 配置。

安装：`dsh plugin --profile web add @huakirax/dsh-effort-lock`

Locks the reasoning-effort popover in the Claude-style model picker while the current
conversation uses a Claude model and already has at least one turn. Switching effort
mid-conversation makes Magpie re-bill the whole history cache, so the slider is grayed
out with a note explaining why. New conversations and non-Claude models are unaffected.

Works together with `dsh-claude-style` (it targets the same popover DOM contract).
