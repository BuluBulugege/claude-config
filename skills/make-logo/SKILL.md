---
name: make-logo
description: Generate a project logo with the project name embedded. Use when asked to create a logo for a project. Reads project name from package.json or directory name, then generates a logo via AI MCP image generation.
---

# Make Logo

Generate two logo assets using AI MCP with transparent background.

## Step 0 — Design Direction

Run ui-ux-pro-max to get style/color/typography for this project:
```bash
python3 ~/.agents/skills/ui-ux-pro-max/scripts/search.py "<project_name> <domain>" --design-system
```
Use the returned palette, style, and font to inform prompts below.

## Step 1 — Detect Project Name

Read `package.json` → `name`, or use current directory name.

## Step 2 — Icon Logo (transparent)

Call `mcp__ai-mcp__image_generate` with `transparentBackground: true`:
```
Minimal modern logo icon for "[PROJECT NAME]". Single bold icon/mascot mark, no text.
Style: [from ui-ux-pro-max]. Colors: [from ui-ux-pro-max].
Transparent background. Square. Professional and memorable.
```
Save → `public/logo.png`

## Step 3 — Logo + Text Fusion (README hero)

Call `mcp__ai-mcp__image_generate` with `transparentBackground: true`:
```
Logo lockup for "[PROJECT NAME]". Left: icon mark (same style as logo.png).
Right: "[PROJECT NAME]" in bold [font from ui-ux-pro-max].
Transparent background. Horizontal 3:1 ratio. No borders or decorations.
```
Save → `public/logo-text.png`

## Step 4 — Report both paths.
`logo-text.png` is the README hero (first image in README).
