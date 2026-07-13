#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getEncoding } = require('js-tiktoken');

const targetDir = process.cwd();

// Setup colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  red: '\x1b[31m'
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
function style(text, colorKey) {
  return useColor ? `${colors[colorKey]}${text}${colors.reset}` : text;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPct(pct) {
  return `${pct.toFixed(1)}%`;
}

// Token counter helper with speed fallback for large files
function countTokens(content, enc) {
  if (!content) return 0;
  // If file is extremely large, estimate to avoid CPU blocking
  if (content.length > 150000) {
    return Math.round(content.length / 3.7);
  }
  try {
    return enc.encode(content).length;
  } catch (e) {
    return Math.round(content.length / 3.7);
  }
}

// Locates the repomix output file
function findRepomixOutputFile(dir) {
  const configPath = path.join(dir, 'repomix.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.output && config.output.filePath) {
        const filePath = path.join(dir, config.output.filePath);
        if (fs.existsSync(filePath)) {
          return { filePath, style: config.output.style || 'markdown' };
        }
      }
    } catch (e) {}
  }
  
  const defaults = [
    { name: 'repomix-output.md', style: 'markdown' },
    { name: 'repomix-output.xml', style: 'xml' },
    { name: 'repomix-output.txt', style: 'plain' },
    { name: 'repomix-output.json', style: 'json' }
  ];
  
  for (const d of defaults) {
    const filePath = path.join(dir, d.name);
    if (fs.existsSync(filePath)) {
      return { filePath, style: d.style };
    }
  }
  
  return null;
}

// Retrieve encoding name configured or default to o200k_base
function getEncodingName(dir) {
  const configPath = path.join(dir, 'repomix.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.tokenCount && config.tokenCount.encoding) {
        return config.tokenCount.encoding;
      }
    } catch (e) {}
  }
  return 'o200k_base';
}

// Lists project files (respecting git-tracked/untracked if in git repo)
function getProjectFiles(dir) {
  try {
    const output = execSync('git ls-files -c -o --exclude-standard', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], cwd: dir });
    return output.split('\n')
      .map(f => f.trim())
      .filter(f => f && fs.existsSync(path.join(dir, f)) && !fs.statSync(path.join(dir, f)).isDirectory() && !f.startsWith('.git/'));
  } catch (e) {
    return scanDir(dir);
  }
}

function scanDir(dir, baseDir = dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.husky', 'dist', 'build', 'out', '.next', '.nuxt', '.cache'].includes(entry.name)) {
        continue;
      }
      files = files.concat(scanDir(fullPath, baseDir));
    } else {
      if (['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'repomix-output.md', 'repomix-output.xml', 'repomix-output.txt', 'repomix-output.json'].includes(entry.name)) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp4', '.mp3', '.pdf', '.zip', '.tar.gz', '.woff', '.woff2', '.ttf', '.eot', '.db', '.sqlite'];
      if (binaryExts.includes(ext)) {
        continue;
      }
      files.push(relPath);
    }
  }
  return files;
}

// Parses packed files from output based on style
function parsePackedFiles(filePath, styleContent, content) {
  const packedFiles = [];
  if (styleContent === 'json') {
    try {
      const json = JSON.parse(content);
      if (json.files) {
        if (Array.isArray(json.files)) {
          return json.files.map(f => f.path);
        } else {
          return Object.keys(json.files);
        }
      }
    } catch (e) {}
  }
  
  // Try XML match
  const xmlRegex = /<file\s+path="([^"]+)"/g;
  let match;
  while ((match = xmlRegex.exec(content)) !== null) {
    packedFiles.push(match[1]);
  }
  
  if (packedFiles.length === 0) {
    // Try Markdown match (## File: path/to/file)
    const mdRegex = /^##\s+File:\s+(.+)$/gm;
    while ((match = mdRegex.exec(content)) !== null) {
      packedFiles.push(match[1].trim());
    }
  }
  
  return packedFiles;
}

// Fetch RTK data
function getRtkGains() {
  const result = {
    project: null,
    global: null
  };
  
  const cmdProject = 'rtk gain -p -f json';
  const cmdGlobal = 'rtk gain -f json';
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const localRtk = path.join(homeDir, '.local', 'bin', 'rtk');
  
  const runRtkJson = (cmd) => {
    try {
      return JSON.parse(execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }));
    } catch (e) {
      try {
        const localCmd = cmd.replace(/^rtk/, `"${localRtk}"`);
        return JSON.parse(execSync(localCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }));
      } catch (err) {
        return null;
      }
    }
  };
  
  result.project = runRtkJson(cmdProject);
  result.global = runRtkJson(cmdGlobal);
  return result;
}

console.log(style('\n==================================================', 'cyan'));
console.log(style('           TOKEN SAVER GAINS SUMMARY', 'bold'));
console.log(style('==================================================', 'cyan'));

// Initialize tokenizer
const encodingName = getEncodingName(targetDir);
let enc;
try {
  enc = getEncoding(encodingName);
} catch (e) {
  enc = getEncoding('o200k_base');
}

// 1. Repomix Gains
let repomixSaved = 0;
const repomixFile = findRepomixOutputFile(targetDir);

if (!repomixFile) {
  console.log(style('\n📦 REPOMIX GAINS', 'bold'));
  console.log(style('--------------------------------------------------', 'gray'));
  console.log(style('ℹ️ No active Repomix output file found in this workspace.', 'yellow'));
  console.log(style('   Run `repomix` to pack and optimize your codebase.', 'gray'));
} else {
  try {
    const packedContent = fs.readFileSync(repomixFile.filePath, 'utf8');
    const packedTokens = countTokens(packedContent, enc);
    const packedChars = packedContent.length;
    
    const packedFilesList = parsePackedFiles(repomixFile.filePath, repomixFile.style, packedContent);
    const projectFiles = getProjectFiles(targetDir).filter(file => {
      return path.basename(file) !== path.basename(repomixFile.filePath);
    });
    
    // Calculate raw size of packed files
    let packedRawTokens = 0;
    let packedRawChars = 0;
    for (const file of packedFilesList) {
      const fullPath = path.join(targetDir, file);
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        packedRawTokens += countTokens(fileContent, enc);
        packedRawChars += fileContent.length;
      }
    }
    
    // Calculate total project raw size
    let projectRawTokens = 0;
    let projectRawChars = 0;
    for (const file of projectFiles) {
      // Avoid counting the repomix output file itself
      if (path.basename(file) === path.basename(repomixFile.filePath)) continue;
      
      const fullPath = path.join(targetDir, file);
      if (fs.existsSync(fullPath)) {
        try {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          projectRawTokens += countTokens(fileContent, enc);
          projectRawChars += fileContent.length;
        } catch (e) {}
      }
    }
    
    // Ensure project raw size is at least packed raw size to avoid weird percentages
    if (projectRawTokens < packedRawTokens) {
      projectRawTokens = packedRawTokens;
      projectRawChars = packedRawChars;
    }
    
    const filteringSavedTokens = Math.max(0, projectRawTokens - packedRawTokens);
    const compressionSavedTokens = Math.max(0, packedRawTokens - packedTokens);
    const totalSavedTokens = Math.max(0, projectRawTokens - packedTokens);
    repomixSaved = totalSavedTokens;
    
    const filteringPct = projectRawTokens > 0 ? (filteringSavedTokens / projectRawTokens) * 100 : 0;
    const compressionPct = packedRawTokens > 0 ? (compressionSavedTokens / packedRawTokens) * 100 : 0;
    const totalPct = projectRawTokens > 0 ? (totalSavedTokens / projectRawTokens) * 100 : 0;
    
    console.log(style('\n📦 REPOMIX GAINS (Current Pack File)', 'bold'));
    console.log(style('--------------------------------------------------', 'gray'));
    console.log(`Packed Output:      ${style(path.basename(repomixFile.filePath), 'cyan')}`);
    console.log(`Files Packed:       ${style(packedFilesList.length, 'green')} of ${style(projectFiles.length, 'green')} total files`);
    
    console.log(`\n${style('- Repository Filtering (Ignored files/folders):', 'bold')}`);
    console.log(`  Total Project Raw:  ${style(formatNumber(projectRawTokens), 'yellow')} tokens (${formatNumber(projectRawChars)} chars)`);
    console.log(`  Packed Files Raw:   ${style(formatNumber(packedRawTokens), 'yellow')} tokens (${formatNumber(packedRawChars)} chars)`);
    console.log(`  Tokens Saved:       ${style(formatNumber(filteringSavedTokens), 'green')} tokens (${style(formatPct(filteringPct), 'green')} saved)`);
    
    console.log(`\n${style('- Code Compression (Strip Comments/Empty Lines):', 'bold')}`);
    console.log(`  Packed Files Raw:   ${style(formatNumber(packedRawTokens), 'yellow')} tokens`);
    console.log(`  Final Packed File:  ${style(formatNumber(packedTokens), 'yellow')} tokens (${formatNumber(packedChars)} chars)`);
    console.log(`  Tokens Saved:       ${style(formatNumber(compressionSavedTokens), 'green')} tokens (${style(formatPct(compressionPct), 'green')} saved)`);
    
    console.log(`\n${style('Total Repomix Savings:', 'bold')} ${style(formatNumber(totalSavedTokens), 'green')} tokens (${style(formatPct(totalPct), 'green')} saved)`);
  } catch (err) {
    console.log(style('\n📦 REPOMIX GAINS', 'bold'));
    console.log(style('--------------------------------------------------', 'gray'));
    console.log(style(`❌ Error reading/processing Repomix file: ${err.message}`, 'red'));
  }
}

// 2. RTK Gains
let rtkProjectSaved = 0;
let rtkGlobalSaved = 0;
const rtkData = getRtkGains();

console.log(style('\n🚀 RTK (RUST TOKEN KILLER) GAINS', 'bold'));
console.log(style('--------------------------------------------------', 'gray'));

if (!rtkData.project && !rtkData.global) {
  console.log(style('ℹ️ RTK is not installed or has no command execution data yet.', 'yellow'));
  console.log(style('   Ensure RTK is set up using `/token-saver:setup`.', 'gray'));
} else {
  // Project savings
  if (rtkData.project && rtkData.project.summary && rtkData.project.summary.total_commands > 0) {
    const summary = rtkData.project.summary;
    rtkProjectSaved = summary.total_saved || 0;
    console.log(`${style('[Project-Specific History]', 'bold')}`);
    console.log(`  Commands Filtered:  ${style(summary.total_commands, 'cyan')}`);
    console.log(`  Original Content:   ${style(formatNumber(summary.total_input + summary.total_output + summary.total_saved), 'yellow')} tokens`);
    console.log(`  Tokens Saved:       ${style(formatNumber(rtkProjectSaved), 'green')} tokens (${style(formatPct(summary.avg_savings_pct), 'green')} saved)`);
  } else {
    console.log(style('ℹ️ No RTK commands tracked for this project yet.', 'yellow'));
  }
  
  // Global savings
  if (rtkData.global && rtkData.global.summary && rtkData.global.summary.total_commands > 0) {
    const summary = rtkData.global.summary;
    rtkGlobalSaved = summary.total_saved || 0;
    console.log(`\n${style('[Global History Across All Repos]', 'bold')}`);
    console.log(`  Commands Filtered:  ${style(summary.total_commands, 'cyan')}`);
    console.log(`  Tokens Saved:       ${style(formatNumber(rtkGlobalSaved), 'green')} tokens (${style(formatPct(summary.avg_savings_pct), 'green')} saved)`);
  }
}

// 3. Totals
const totalSavedProject = repomixSaved + rtkProjectSaved;
// Assume conservative $3.00 per 1M tokens cost for context window savings
const costSavings = (totalSavedProject / 1000000) * 3.0;

console.log(style('\n==================================================', 'cyan'));
console.log(style('TOTAL SAVINGS FOR THIS PROJECT', 'bold'));
console.log(style('==================================================', 'cyan'));
console.log(`Repomix Savings:      ${style(formatNumber(repomixSaved), 'green')} tokens`);
console.log(`RTK Project Savings:  ${style(formatNumber(rtkProjectSaved), 'green')} tokens`);
console.log(`${style('Total Tokens Saved:', 'bold')}   ${style(formatNumber(totalSavedProject), 'green')} tokens`);
console.log(`${style('Estimated Cost Saved:', 'bold')} ${style('$' + costSavings.toFixed(2), 'green')} ${style('(based on $3.00 / M tokens)', 'gray')}`);
console.log(style('==================================================\n', 'cyan'));

// Free the encoder
try {
  enc.free();
} catch (e) {}
