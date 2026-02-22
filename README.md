# claude-config

My personal Claude Code configuration — agents, skills, and MCP servers.

## Structure

```
agents/          # Subagents (auto-triggered by Claude)
skills/          # Slash command skills
mcp-servers/
  ai-mcp/        # AI media generation server (image, video, TTS, Whisper)
```

## Agents

| Agent | Role |
|---|---|
| `ai-backend-agent` | AI integration, prompt engineering, API routes |
| `db-agent` | SQLite schema, migrations, queries |
| `frontend-agent` | React components, UI/UX |
| `git-agent` | Commits, push, PRs |
| `product-analyst-agent` | Product analysis, GTM strategy |
| `product-packager-agent` | Logo, README, illustrations |
| `review-agent` | Bug review + feature completeness (parallel) |

## MCP Servers

### ai-mcp

AI media generation server supporting image, video, TTS, and Whisper transcription.

**Setup:**
```bash
cd mcp-servers/ai-mcp
npm install
cp config/ai-config.example.json config/ai-config.json
# Edit ai-config.json with your API keys
npm run build
```

**Register in `~/.claude/settings.json`:**
```json
{
  "mcpServers": {
    "ai-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-servers/ai-mcp/dist/index.js"]
    }
  }
}
```

## Skills

Install via [skills CLI](https://skills.sh):
```bash
npx skills add <owner/repo@skill>
```
