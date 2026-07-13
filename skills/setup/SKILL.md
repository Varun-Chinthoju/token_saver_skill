---
name: setup
description: Set up Repomix and RTK for Google Antigravity in this repository
---

When the user types `/token-saver:setup` or invokes this skill, you MUST autonomously execute the setup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/setup/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the setup script using the `run_command` tool, explicitly passing the `--agent antigravity` flag so RTK is correctly initialized for Google Antigravity:
   `node <plugin-root>/bin/setup.js --agent antigravity`
