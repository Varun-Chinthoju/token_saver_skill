# Repomix Companion Skill

A cross-tool companion that completely automates the installation, configuration, and cleanup of [Repomix](https://repomix.com/) in your repositories to optimize AI token usage. Works with **Antigravity (AGY)**, **Claude Code**, and **Cursor / Copilot (Codex)**.

## Installation

### 1. Antigravity (AGY)
To install this globally as an AGY plugin:
```bash
agy plugin install https://github.com/Varun-Chinthoju/repomix_skill
```

### 2. Claude Code & Codex (Cursor / Copilot)
To use it inside other AI environments without installing AGY, you can run the setup/cleanup script directly using `npx` (if published to npm) or by cloning the repository and running the scripts.

Run via `npx` (once published):
```bash
npx repomix-skill-setup
```
To clean up:
```bash
npx repomix-skill-cleanup
```

Alternatively, you can copy the `bin/setup.js` and `bin/cleanup.js` scripts directly to your local project and run them via Node:
```bash
node setup.js
node cleanup.js
```

---

## Slash Commands (AGY Only)

Once installed in AGY, the following commands are available:

### `/repomix:setup`
The agent will autonomously run `bin/setup.js` which:
1. Installs Repomix globally (`npm install -g repomix`).
2. Generates an optimized `repomix.config.json` in the root.
3. Scans your stack (e.g. Python, Go, Rust, Node) and generates a tailored `.repomixignore` file.
4. Creates or updates `AGENTS.md` to instruct AI assistants to read the Repomix output before viewing individual source files.
5. Installs Husky and registers a `pre-commit` hook to automatically compile the repository context to `repomix-output.md` on git commit.

### `/repomix:cleanup`
The agent will autonomously run `bin/cleanup.js` which:
1. Deletes the generated Repomix configuration, ignore files, and output markdown files.
2. Removes Repomix-specific instructions from `AGENTS.md` (and deletes `AGENTS.md` if it becomes empty).
3. Reverts the Husky pre-commit hook changes.
