---
name: make-readme
description: Generate a high-quality bilingual GitHub README (English + Chinese) with language switcher. Use when asked to write or improve a README. Reads actual project files before writing.
---

# Make README

Generate bilingual README files for the current project.

## Steps

1. Read the codebase to understand features, tech stack, and usage.

2. Write `README.md` (English):
   - First line: `[中文](./README.zh.md) | **English**`
   - Structure: logo → badges → one-line description → pipeline/how-it-works → features table → quick start → config → usage → tech stack → license
   - Reference illustrations as `public/illus-*.en.png` if they exist

3. Write `README.zh.md` (Chinese):
   - First line: `**中文** | [English](./README.md)`
   - Same structure, fully translated to Chinese
   - Reference illustrations as `public/illus-*.zh.png` if they exist

## Style rules
- Logo centered via `<p align="center"><img src="public/logo.png" width="120" /></p>`
- Badges on one line (shields.io)
- Features as a clean 2-column table (feature name | description)
- Code blocks for all commands and config
- No placeholder text — every section must have real content from the codebase
