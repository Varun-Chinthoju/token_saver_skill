---
name: repomix
description: Automates the setup and cleanup of Repomix and RTK (Rust Token Killer) to optimize AI token usage.
---

This skill provides two slash commands: `/repomix:setup` and `/repomix:cleanup`.

## /repomix:setup
When the user types `/repomix:setup`, you MUST autonomously execute the setup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/repomix/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the setup script using the `run_command` tool, explicitly passing the `--agent antigravity` flag so RTK is correctly initialized for Google Antigravity:
   `node <plugin-root>/bin/setup.js --agent antigravity`

## /repomix:cleanup
When the user types `/repomix:cleanup`, you MUST autonomously execute the cleanup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/repomix/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the cleanup script using the `run_command` tool, passing the same `--agent antigravity` flag:
   `node <plugin-root>/bin/cleanup.js --agent antigravity`
