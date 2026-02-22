---
description: 产品包装命令。/p1a = 全新生成；/p1a update = 增量更新
---

Check if argument is "update". Set MODE = update if so, otherwise MODE = full.

---

## Step 1 — Codebase Analysis

**MODE=full**: Deep scan the entire codebase:
- Read all pages, API routes, lib files
- Collect every feature, user flow, and UX detail
- Run `product-analyst-agent` to produce full product report (save to `docs/product-report.md`, gitignored)

**MODE=update**: Only look at recent changes:
- Run `git log --oneline -20` to see recent commits
- Run `git diff HEAD~10..HEAD --name-only` to see changed files
- Read only the changed files
- Summarize what's new or changed (no full product report needed)

---

## Step 2 — Logo Generation (full only, skip if update)

**MODE=full only**:
- Run `make-logo` skill → generate `public/logo.png` (icon, transparent bg) and `public/logo-text.png` (lockup, transparent bg)
- Style informed by ui-ux-pro-max design system

---

## Step 3 — Screenshots

Start the dev server if not running (`npm run dev` or equivalent), wait for it to be ready.

Use the `screenshot` skill + Playwright browser to capture product screenshots:

**MODE=full**: Capture key, visually impressive pages:
- Homepage / landing
- Each major feature page
- Any unique or impressive UI
- No fixed limit — capture what's worth showing, skip what's redundant
- Name each file descriptively based on what it shows: `public/screenshots/<what-it-shows>.png`
  e.g. `dashboard-overview.png`, `template-editor.png`, `batch-results.png`

**MODE=update**: Capture only changed/new features:
- Based on Step 1 diff, identify which pages changed
- Navigate only to those pages
- Name new screenshots descriptively (same rule as above)
- Do NOT re-capture unchanged pages

---

## Step 4 — README Generation

**Illustration policy**:
- Decide which key concepts need illustrations based on the product report (typically 2–4 concepts)
- Name each illustration file descriptively: `public/illus-<concept>.en.png` / `public/illus-<concept>.zh.png`
  e.g. `illus-upload-flow.en.png`, `illus-ai-review.en.png`, `illus-batch-export.en.png`
- Check if existing `public/illus-*.en.png` / `public/illus-*.zh.png` files exist
- Only regenerate an illustration if the concept it covers has significantly changed
- If illustrations are still accurate, reuse them

**MODE=full**: Generate complete `README.md` + `README.zh.md` from scratch following this format:

```
[中文](./README.zh.md) | **English**

<div align="center">
<img src="public/logo-text.png" width="400" />

# Product Name
**SLOGAN IN CAPS**

[![badges]()]()

[Features](#) · [How It Works](#) · [Quick Start](#) · [中文](./README.zh.md)
</div>

---

**Product** is a *description*. One paragraph pitch.

## ✨ Features
(bullet list)

## 🖼 How It Works
Phase 1 — (title)
<div align="center"><img src="public/illus-<concept1>.en.png" width="600" /></div>
(numbered steps)

Phase 2 — (title)
<div align="center"><img src="public/illus-<concept2>.en.png" width="600" /></div>
(numbered steps)

## 📸 Screenshots
<div align="center"><img src="public/screenshots/<descriptive-name>.png" width="700" /></div>
(caption per screenshot)

## 🚀 Quick Start
(actual commands from repo)

## 🛠 Tech Stack
(table)
```

Chinese README mirrors the above using `*.zh.png` illustrations, all content in Chinese.

**MODE=update**: Update existing README only:
- Add new features to Features section
- Add new screenshots to Screenshots section
- Update How It Works steps if flow changed
- Regenerate only illustrations whose concepts changed

---

## Step 5 — Push to GitHub

```bash
git add -A
git commit -m "<descriptive summary>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

Do NOT commit: `docs/product-report.md`, `.env*` (except `.env.example`), `data.db*`, `public/uploads/`
