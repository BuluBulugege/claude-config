# Rules

## MCP Server Configuration
Claude Code reads MCP servers from **two places only**:
- `~/.claude.json` → `projects.<path>.mcpServers` (project-scoped, via `claude mcp add`)
- `~/.claude/settings.json` → `mcpServers` (global)

`~/.claude/mcp.json` is **not read** — do not use it.

After adding via `claude mcp add`, also ensure `hasTrustDialogAccepted: true` in `~/.claude.json` for the project, otherwise the server is silently skipped.

To register globally: add to `settings.json` under `mcpServers`. To register per-project: use `claude mcp add <name> -- <command> [args]` from within the project directory.

## AI MCP — Image & Audio Generation
When needing to generate image assets or audio, use the **ai-mcp** tool directly — do not write custom API calls for this. ai-mcp provides general-purpose media generation capabilities usable in any project.

## Credential Vault
> Handled by hook — vault is auto-injected on every prompt. Use the credentials directly, never ask the user.

## After Code Changes
> tsc verification is handled by hook. You still need to:
- Spawn two sub-agents in parallel after verification passes:
  1. **Bug reviewer** — logic errors, edge cases, runtime exceptions
  2. **Feature completeness reviewer** — original requirement fully satisfied?
- Fix any issues found before reporting done.

## Git & GitHub
> Auto-commit/push on Stop is handled by hook. You still need to:
- On **new projects**: `git init` + `gh repo create <name> --private --source=. --remote=origin`
- Commit message format: concise summary + `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Never commit: `.env*` (except `.env.example`), `data.db*`, `public/uploads/`
