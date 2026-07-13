---
name: token-saver
description: Automates the setup and cleanup of Repomix and RTK (Rust Token Killer) to optimize AI token usage.
---

This skill provides three slash commands: `/token-saver:setup`, `/token-saver:cleanup`, and `/token-saver:gains`.

## /token-saver:setup
When the user types `/token-saver:setup`, you MUST autonomously execute the setup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/token-saver/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the setup script using the `run_command` tool, explicitly passing the `--agent antigravity` flag so RTK is correctly initialized for Google Antigravity:
   `node <plugin-root>/bin/setup.js --agent antigravity`

## /token-saver:cleanup
When the user types `/token-saver:cleanup`, you MUST autonomously execute the cleanup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/token-saver/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the cleanup script using the `run_command` tool, passing the same `--agent antigravity` flag:
   `node <plugin-root>/bin/cleanup.js --agent antigravity`

## /token-saver:gains
When the user types `/token-saver:gains`, you MUST autonomously execute the gains summary script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/token-saver/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the gains script using the `run_command` tool:
   `node <plugin-root>/bin/gains.js`
