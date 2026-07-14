# Token Saver Companion Skill

A cross-tool companion that completely automates the installation, configuration, and cleanup of both [Repomix](https://repomix.com/) and [RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) in your repositories to optimize AI token usage. Works with **Antigravity (AGY)**, **Claude Code**, and **Cursor / Copilot (Codex)**.

## Installation & Usage by Coding Agent

### 1. Antigravity (AGY)
To install globally as an AGY plugin:
```bash
agy plugin install https://github.com/Varun-Chinthoju/token_saver_skill
```
Once installed, the agent will autonomously run the setup, cleanup, and gains scripts via AGY Slash Commands:
* `/token-saver:setup`
* `/token-saver:cleanup`
* `/token-saver:gains`

---

### 2. Claude Code
Initialize Repomix and RTK global hooks tailored for Claude Code.

* **Set up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-setup --agent claude -g

  # Via npm (once published):
  npx --package=token-saver token-saver-setup --agent claude -g

  # Via local clone:
  node bin/setup.js --agent claude -g
  ```
* **Clean up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-cleanup --agent claude -g

  # Via npm (once published):
  npx --package=token-saver token-saver-cleanup --agent claude -g

  # Via local clone:
  node bin/cleanup.js --agent claude -g
  ```

---

### 3. Codex CLI
Set up local workspace optimizations and RTK instructions (`AGENTS.md` and `RTK.md`) for the Codex CLI.

* **Set up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-setup --codex

  # Via npm (once published):
  npx --package=token-saver token-saver-setup --codex

  # Via local clone:
  node bin/setup.js --codex
  ```
* **Clean up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-cleanup --codex

  # Via npm (once published):
  npx --package=token-saver token-saver-cleanup --codex

  # Via local clone:
  node bin/cleanup.js --codex
  ```

---

### 4. Editors (Cursor, Copilot, Windsurf, Cline)
Configure RTK and workspace instructions for your preferred editor/agent. Replace `[agent]` with `cursor`, `windsurf`, or `cline`.

* **Set up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-setup --agent [agent]

  # Via npm (once published):
  npx --package=token-saver token-saver-setup --agent [agent]

  # Via local clone:
  node bin/setup.js --agent [agent]
  ```
* **Clean up:**
  ```bash
  # Directly via npx (from GitHub):
  npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-cleanup --agent [agent]

  # Via npm (once published):
  npx --package=token-saver token-saver-cleanup --agent [agent]

  # Via local clone:
  node bin/cleanup.js --agent [agent]
  ```

---

### 📊 Checking Token Gains (All Non-AGY Agents)
To inspect the current packed sizes and query RTK historical log savings:
```bash
# Directly via npx (from GitHub):
npx --package=github:Varun-Chinthoju/token_saver_skill token-saver-gains

# Via npm (once published):
npx --package=token-saver token-saver-gains

# Via local clone:
node bin/gains.js
```

---

### Supported Options
*   `--agent <name>`: Target agent to initialize RTK for. Possible values: `antigravity`, `cursor`, `windsurf`, `cline`, `kilocode`, `pi`, `hermes`, `claude`.
*   `--codex`: Target Codex CLI (uses `AGENTS.md` + `RTK.md`, no Claude hook patching).
*   `--gemini`: Initialize for Gemini CLI.
*   `-g` / `--global`: Enforce global hook setup for RTK where applicable.

If no flags are specified, it defaults to standard Claude Code / Copilot setup (`rtk init -g`).



---

## Slash Commands (AGY Only)

Once installed in AGY, the following commands are available:

### `/token-saver:setup`
The agent will autonomously run `bin/setup.js --agent antigravity` which:
1. Installs Repomix globally (`npm install -g repomix`).
2. Generates an optimized `repomix.config.json` in the root.
3. Scans your stack (e.g. Python, Go, Rust, Node) and generates a tailored `.repomixignore` file.
4. Creates or updates `AGENTS.md` to instruct AI assistants to read the Repomix output before viewing individual source files.
5. Installs Husky and registers a `pre-commit` hook to automatically compile the repository context to `repomix-output.md` on git commit.
6. Installs **RTK (Rust Token Killer)** and runs `rtk init --agent antigravity` to inject token-optimized CLI rewrites into AGY.

### `/token-saver:cleanup`
The agent will autonomously run `bin/cleanup.js --agent antigravity` which:
1. Deletes the generated Repomix configuration, ignore files, and output markdown files.
2. Removes Repomix-specific instructions from `AGENTS.md` (and deletes `AGENTS.md` if it becomes empty).
3. Reverts the Husky pre-commit hook changes.
4. Uninstalls RTK hooks and configurations (`rtk init --uninstall`).

### `/token-saver:gains`
The agent will autonomously run `bin/gains.js` which:
1. Inspects the current Repomix output in the workspace.
2. Compares the size of the packed output to the uncompressed raw codebase files to calculate Repomix filtering and compression gains.
3. Queries RTK historical logs (`rtk gain`) for both project-specific and global CLI proxy token savings.
4. Summarizes and prints individual and total token and cost savings.
