#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = process.cwd();

console.log('🧹 Starting Repomix & RTK cleanup...');

// Helper to run commands
function runCmd(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to run command: ${cmd}`);
  }
}

// Parse arguments
const args = process.argv.slice(2);
let agent = null;
let isCodex = false;
let isGemini = false;
let isGlobal = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--agent' && i + 1 < args.length) {
    agent = args[++i];
  } else if (arg === '--codex') {
    isCodex = true;
  } else if (arg === '--gemini') {
    isGemini = true;
  } else if (arg === '--global' || arg === '-g') {
    isGlobal = true;
  }
}

// 1. Remove Repomix Files
const filesToRemove = ['repomix.config.json', '.repomixignore', 'repomix-output.md'];
filesToRemove.forEach(file => {
  const filePath = path.join(targetDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Removed ${file}`);
  }
});

// 2. Clean Up AGENTS.md for Repomix
const agentsPath = path.join(targetDir, 'AGENTS.md');
const ruleText = 'To build context, you MUST read the `repomix-*.md` files first. Only read individual raw source files if you are preparing to directly modify them.';

if (fs.existsSync(agentsPath)) {
  let content = fs.readFileSync(agentsPath, 'utf8');
  
  // Remove Repomix rule
  const regex = new RegExp(`\\r?\\n*[-*]\\s+${ruleText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\r?\\n*`, 'g');
  content = content.replace(regex, '\n').trim();
  
  // Remove RTK reference if added by --codex local config
  content = content.replace(/\r?\n*@RTK\.md\r?\n*/g, '\n').trim();
  content = content.replace(/\r?\n*@.*\/RTK\.md\r?\n*/g, '\n').trim();
  
  if (content === '' || content === '# Agent Rules') {
    try {
      fs.unlinkSync(agentsPath);
      console.log('🗑️ Removed empty AGENTS.md');
    } catch (e) {
      console.error(`❌ Failed to delete AGENTS.md: ${e.message}`);
    }
  } else {
    fs.writeFileSync(agentsPath, content + '\n');
    console.log('✅ Cleaned up AGENTS.md');
  }
}

// Remove local RTK.md if it exists (e.g. from --codex)
const localRtkMd = path.join(targetDir, 'RTK.md');
if (fs.existsSync(localRtkMd)) {
  fs.unlinkSync(localRtkMd);
  console.log('🗑️ Removed RTK.md');
}

// Remove local .rtk/filters.toml if it exists
const rtkDir = path.join(targetDir, '.rtk');
if (fs.existsSync(rtkDir)) {
  const filtersPath = path.join(rtkDir, 'filters.toml');
  if (fs.existsSync(filtersPath)) {
    fs.unlinkSync(filtersPath);
  }
  try {
    fs.rmdirSync(rtkDir);
    console.log('🗑️ Removed .rtk directory');
  } catch (e) {}
}

// Clean up CLAUDE.md from RTK instructions
const claudePath = path.join(targetDir, 'CLAUDE.md');
if (fs.existsSync(claudePath)) {
  let content = fs.readFileSync(claudePath, 'utf8');
  const rtkBlockRegex = /<!-- rtk-instructions v2 -->[\s\S]*?<!-- \/rtk-instructions -->\r?\n?/g;
  if (rtkBlockRegex.test(content)) {
    content = content.replace(rtkBlockRegex, '').trim();
    if (content === '') {
      fs.unlinkSync(claudePath);
      console.log('🗑️ Removed empty CLAUDE.md');
    } else {
      fs.writeFileSync(claudePath, content + '\n');
      console.log('✅ Removed RTK instructions from CLAUDE.md');
    }
  }
}

// Clean up .agents/rules/antigravity-rtk-rules.md (if exists)
const agyRtkRules = path.join(targetDir, '.agents', 'rules', 'antigravity-rtk-rules.md');
if (fs.existsSync(agyRtkRules)) {
  fs.unlinkSync(agyRtkRules);
  console.log('🗑️ Removed antigravity-rtk-rules.md');
  
  // Try to remove .agents/rules and .agents if empty
  try {
    fs.rmdirSync(path.join(targetDir, '.agents', 'rules'));
    fs.rmdirSync(path.join(targetDir, '.agents'));
  } catch (e) {}
}

// 3. Revert Husky Configuration
const huskyHookPath = path.join(targetDir, '.husky', 'pre-commit');
if (fs.existsSync(huskyHookPath)) {
  let content = fs.readFileSync(huskyHookPath, 'utf8');
  
  const lines = content.split(/\r?\n/);
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== 'repomix' && trimmed !== 'git add repomix-output.md';
  });
  
  const activeLines = filteredLines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('.');
  });

  if (activeLines.length === 0) {
    try {
      fs.unlinkSync(huskyHookPath);
      console.log('🗑️ Removed empty Husky pre-commit hook');
    } catch (e) {
      console.error(`❌ Failed to delete pre-commit hook: ${e.message}`);
    }
    console.log('ℹ️ Husky pre-commit hook is empty. You can uninstall Husky by running:\n   npm uninstall husky && rm -rf .husky');
  } else {
    fs.writeFileSync(huskyHookPath, filteredLines.join('\n'));
    console.log('✅ Removed Repomix commands from Husky pre-commit hook');
  }
}

// 4. Uninstall RTK from global hooks if requested or default global
console.log('🧹 Checking for RTK global uninstall...');

function getRtkCommand() {
  try {
    execSync('rtk --version', { stdio: 'ignore' });
    return 'rtk';
  } catch (e) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const localRtk = path.join(homeDir, '.local', 'bin', 'rtk');
    if (fs.existsSync(localRtk)) {
      return localRtk;
    }
    return null;
  }
}

const rtkCmd = getRtkCommand();

if (rtkCmd) {
  // Build uninstall arguments
  let rtkArgs = ['init', '--uninstall'];
  const globalRequiredAgents = ['cursor', 'windsurf', 'pi'];
  const isDefaultClaude = !agent && !isCodex && !isGemini;
  const useGlobal = isGlobal || isDefaultClaude || (agent && globalRequiredAgents.includes(agent.toLowerCase()));

  if (useGlobal) {
    rtkArgs.push('-g');
    if (agent) {
      rtkArgs.push('--agent', agent);
    }
    console.log(`🔧 Running RTK uninstall: ${rtkArgs.join(' ')}...`);
    runCmd(`"${rtkCmd}" ${rtkArgs.join(' ')}`);
  } else {
    console.log('ℹ️ RTK local uninstall complete (removed local file modifications).');
  }
}

console.log('🎉 Repomix & RTK cleanup complete!');
