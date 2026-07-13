#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();

console.log('🧹 Starting Repomix cleanup...');

// 1. Remove Repomix Files
const filesToRemove = ['repomix.config.json', '.repomixignore', 'repomix-output.md'];
filesToRemove.forEach(file => {
  const filePath = path.join(targetDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Removed ${file}`);
  }
});

// 2. Clean Up AGENTS.md
const agentsPath = path.join(targetDir, 'AGENTS.md');
const ruleText = 'To build context, you MUST read the `repomix-*.md` files first. Only read individual raw source files if you are preparing to directly modify them.';

if (fs.existsSync(agentsPath)) {
  let content = fs.readFileSync(agentsPath, 'utf8');
  
  // Try to remove the rule, handling list formats (- or *) and potential trailing newlines
  const regex = new RegExp(`\\r?\\n*[-*]\\s+${ruleText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\r?\\n*`, 'g');
  const cleanedContent = content.replace(regex, '\n').trim();
  
  if (cleanedContent === '' || cleanedContent === '# Agent Rules') {
    try {
      fs.unlinkSync(agentsPath);
      console.log('🗑️ Removed empty AGENTS.md');
    } catch (e) {
      console.error(`❌ Failed to delete AGENTS.md: ${e.message}`);
    }
  } else {
    fs.writeFileSync(agentsPath, cleanedContent + '\n');
    console.log('✅ Removed rule from AGENTS.md');
  }
}

// 3. Revert Husky Configuration
const huskyHookPath = path.join(targetDir, '.husky', 'pre-commit');
if (fs.existsSync(huskyHookPath)) {
  let content = fs.readFileSync(huskyHookPath, 'utf8');
  
  // Remove repomix lines
  const lines = content.split(/\r?\n/);
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== 'repomix' && trimmed !== 'git add repomix-output.md';
  });
  
  // If the hook only has default script boilerplate left, we can clean up
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
    
    // Check if we should suggest uninstalling Husky
    console.log('ℹ️ Husky pre-commit hook is empty. You can uninstall Husky by running:');
    console.log('   npm uninstall husky && rm -rf .husky');
  } else {
    fs.writeFileSync(huskyHookPath, filteredLines.join('\n'));
    console.log('✅ Removed Repomix commands from Husky pre-commit hook');
  }
}

console.log('🎉 Repomix cleanup complete!');
