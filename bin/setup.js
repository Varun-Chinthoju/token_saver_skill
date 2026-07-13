#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = process.cwd();

console.log('🚀 Starting Repomix & RTK setup...');

// Helper to run commands
function runCmd(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to run command: ${cmd}`);
    process.exit(1);
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

// 1. Install Repomix globally
console.log('📦 Installing Repomix globally...');
runCmd('npm install -g repomix');

// 2. Create repomix.config.json
console.log('⚙️ Creating repomix.config.json...');
const configPath = path.join(targetDir, 'repomix.config.json');
const configContent = {
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 52428800
  },
  "output": {
    "filePath": "repomix-output.md",
    "style": "markdown",
    "filePathStyle": "target-relative",
    "parsableStyle": false,
    "fileSummary": false,
    "directoryStructure": false,
    "files": true,
    "removeComments": true,
    "removeEmptyLines": true,
    "compress": true,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "truncateBase64": false,
    "copyToClipboard": false,
    "includeFullDirectoryStructure": false,
    "tokenCountTree": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false,
      "includeLogs": false,
      "includeLogsCount": 50
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDotIgnore": true,
    "useDefaultPatterns": true,
    "customPatterns": []
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
};

fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
console.log('✅ Created repomix.config.json');

// 3. Generate .repomixignore dynamically based on project stack
console.log('🔍 Analyzing repository stack to generate .repomixignore...');
const ignorePatterns = [
  '# Package managers & lockfiles',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '',
  '# Output/Build directories',
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  '.docusaurus',
  '.svelte-kit',
  '',
  '# Large media and binary assets',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.mp4',
  '*.mp3',
  '*.pdf',
  '*.zip',
  '*.tar.gz',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '',
  '# Database and local environment files',
  '.env*',
  '*.db',
  '*.sqlite',
  '',
  '# IDEs and OS files',
  '.DS_Store',
  '.vscode',
  '.idea',
  '*.log',
  '',
  '# Repomix outputs',
  'repomix-output.md'
];

// Check for Python
if (fs.existsSync(path.join(targetDir, 'requirements.txt')) || fs.existsSync(path.join(targetDir, 'Pipfile')) || fs.existsSync(path.join(targetDir, 'pyproject.toml'))) {
  console.log('🐍 Python stack detected. Adding Python ignores.');
  ignorePatterns.push('', '# Python files', '__pycache__', '*.pyc', '*.pyo', '*.pyd', '.venv', 'venv', 'ENV', 'env', '.pytest_cache');
}

// Check for Go
if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
  console.log('🐹 Go stack detected. Adding Go ignores.');
  ignorePatterns.push('', '# Go files', 'bin', 'vendor');
}

// Check for Rust
if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) {
  console.log('🦀 Rust stack detected. Adding Rust ignores.');
  ignorePatterns.push('', '# Rust files', 'target');
}

const ignorePath = path.join(targetDir, '.repomixignore');
fs.writeFileSync(ignorePath, ignorePatterns.join('\n'));
console.log('✅ Created .repomixignore');

// 4. Enforce Agent Context Rules (AGENTS.md)
console.log('📝 Setting up AGENTS.md rules...');
const agentsPath = path.join(targetDir, 'AGENTS.md');
const ruleText = 'To build context, you MUST read the `repomix-*.md` files first. Only read individual raw source files if you are preparing to directly modify them.';

if (fs.existsSync(agentsPath)) {
  let content = fs.readFileSync(agentsPath, 'utf8');
  if (!content.includes('repomix-*.md')) {
    content += `\n\n- ${ruleText}`;
    fs.writeFileSync(agentsPath, content);
    console.log('✅ Appended rules to existing AGENTS.md');
  } else {
    console.log('ℹ️ Rules already exist in AGENTS.md');
  }
} else {
  const initialContent = `# Agent Rules\n\n- ${ruleText}\n`;
  fs.writeFileSync(agentsPath, initialContent);
  console.log('✅ Created AGENTS.md with rules');
}

// 5. Automate with Husky
console.log('🐶 Setting up Husky pre-commit hooks...');
if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
  console.log('⚠️ package.json not found in root. Initializing a basic package.json to support Husky...');
  runCmd('npm init -y');
}

console.log('📦 Installing Husky...');
runCmd('npm install --save-dev husky');

console.log('🔧 Initializing Husky...');
runCmd('npx husky init');

const huskyHookPath = path.join(targetDir, '.husky', 'pre-commit');
const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

repomix
git add repomix-output.md
`;

fs.writeFileSync(huskyHookPath, preCommitContent);
try {
  fs.chmodSync(huskyHookPath, '755');
} catch (e) {}
console.log('✅ Configured Husky pre-commit hook');

// 6. Install & Configure RTK
console.log('🚀 Checking for RTK...');

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

let rtkCmd = getRtkCommand();

if (!rtkCmd) {
  console.log('📦 RTK is not installed. Installing RTK...');
  const isWin = process.platform === 'win32';
  if (isWin) {
    try {
      execSync('cargo --version', { stdio: 'ignore' });
      console.log('🦀 Installing RTK via Cargo...');
      runCmd('cargo install --git https://github.com/rtk-ai/rtk');
    } catch (e) {
      console.warn('⚠️ Cargo not found. Please install RTK manually on Windows. Refer to https://github.com/rtk-ai/rtk.');
    }
  } else {
    let hasBrew = false;
    try {
      execSync('brew --version', { stdio: 'ignore' });
      hasBrew = true;
    } catch (e) {}

    if (hasBrew) {
      console.log('🍺 Installing RTK via Homebrew...');
      runCmd('brew install rtk');
    } else {
      console.log('🌐 Installing RTK via Quick Install script...');
      runCmd('curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh');
    }
  }
  
  rtkCmd = getRtkCommand();
}

if (rtkCmd) {
  console.log(`✅ RTK is available at: ${rtkCmd}`);
  
  // Build rtk init arguments
  let rtkArgs = ['init'];
  const globalRequiredAgents = ['cursor', 'windsurf', 'pi'];
  const isDefaultClaude = !agent && !isCodex && !isGemini;
  const useGlobal = isGlobal || isDefaultClaude || (agent && globalRequiredAgents.includes(agent.toLowerCase()));

  if (useGlobal) {
    rtkArgs.push('-g');
  }
  if (isCodex) {
    rtkArgs.push('--codex');
  }
  if (isGemini) {
    rtkArgs.push('--gemini');
  }
  if (agent) {
    rtkArgs.push('--agent', agent);
  }

  // Workaround for RTK 0.43.0 bug: create .agents/rules directory before running rtk init for antigravity
  if (agent && agent.toLowerCase() === 'antigravity') {
    const rulesDir = path.join(targetDir, '.agents', 'rules');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
      console.log('✅ Pre-created .agents/rules/ directory to prevent RTK write error.');
    }
  }

  console.log(`🔧 Initializing RTK with arguments: ${rtkArgs.join(' ')}...`);
  runCmd(`"${rtkCmd}" ${rtkArgs.join(' ')}`);
} else {
  console.log('⚠️ Skip RTK initialization as RTK could not be installed.');
}

console.log('🎉 Setup complete! Repomix and RTK are now configured.');
