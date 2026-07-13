---
name: cleanup
description: Clean up Repomix and RTK configurations and files in this repository
---

When the user types `/token-saver:cleanup` or invokes this skill, you MUST autonomously execute the cleanup script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/cleanup/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the cleanup script using the `run_command` tool, passing the same `--agent antigravity` flag:
   `node <plugin-root>/bin/cleanup.js --agent antigravity`
