# Repomix & RTK Companion Skill

A cross-tool companion that completely automates the installation, configuration, and cleanup of both [Repomix](https://repomix.com/) and [RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) in your repositories to optimize AI token usage. Works with **Antigravity (AGY)**, **Claude Code**, and **Cursor / Copilot (Codex)**.

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
npx repomix-skill-setup [options]
```
To clean up:
```bash
npx repomix-skill-cleanup [options]
```

#### Supported Options
*   `--agent <name>`: Target agent to initialize RTK for. Possible values: `antigravity`, `cursor`, `windsurf`, `cline`, `kilocode`, `pi`, `hermes`, `claude`.
*   `--codex`: Target Codex CLI (uses `AGENTS.md` + `RTK.md`, no Claude hook patching).
*   `--gemini`: Initialize for Gemini CLI.
*   `-g` / `--global`: Enforce global hook setup for RTK where applicable.

If no flags are specified, it defaults to standard Claude Code / Copilot setup (`rtk init -g`).

---

## Slash Commands (AGY Only)

Once installed in AGY, the following commands are available:

### `/repomix:setup`
The agent will autonomously run `bin/setup.js --agent antigravity` which:
1. Installs Repomix globally (`npm install -g repomix`).
2. Generates an optimized `repomix.config.json` in the root.
3. Scans your stack (e.g. Python, Go, Rust, Node) and generates a tailored `.repomixignore` file.
4. Creates or updates `AGENTS.md` to instruct AI assistants to read the Repomix output before viewing individual source files.
5. Installs Husky and registers a `pre-commit` hook to automatically compile the repository context to `repomix-output.md` on git commit.
6. Installs **RTK (Rust Token Killer)** and runs `rtk init --agent antigravity` to inject token-optimized CLI rewrites into AGY.

### `/repomix:cleanup`
The agent will autonomously run `bin/cleanup.js --agent antigravity` which:
1. Deletes the generated Repomix configuration, ignore files, and output markdown files.
2. Removes Repomix-specific instructions from `AGENTS.md` (and deletes `AGENTS.md` if it becomes empty).
3. Reverts the Husky pre-commit hook changes.
4. Uninstalls RTK hooks and configurations (`rtk init --uninstall`).
