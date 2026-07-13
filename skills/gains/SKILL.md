---
name: gains
description: Summarize token savings from Repomix and RTK in this repository
---

When the user types `/token-saver:gains` or invokes this skill, you MUST autonomously execute the gains summary script.
To do this:
1. Locate this plugin's installation directory. The skill file is located inside `skills/gains/SKILL.md` relative to the plugin root. You can find the absolute path of this skill file and resolve the plugin root directory (two levels up).
2. Run the gains script using the `run_command` tool:
   `node <plugin-root>/bin/gains.js`
