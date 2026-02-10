#!/usr/bin/env node
/**
 * Git Guardrails Hook
 *
 * PreToolUse hook that blocks dangerous git commands before execution.
 * Prevents accidental destructive git operations like force pushes,
 * hard resets, branch deletions, and wholesale file discards.
 *
 * Exit code 2 = block the command
 * Exit code 0 = allow the command
 */

const { readStdinJson, log } = require('../lib/utils');

const DANGEROUS_PATTERNS = [
  { pattern: /\bgit\s+push\b/, description: 'git push' },
  { pattern: /\bgit\s+reset\s+--hard\b/, description: 'git reset --hard' },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, description: 'git clean -f' },
  { pattern: /\bgit\s+branch\s+-D\b/, description: 'git branch -D' },
  { pattern: /\bgit\s+checkout\s+\.\s*$/, description: 'git checkout .' },
  { pattern: /\bgit\s+restore\s+\.\s*$/, description: 'git restore .' },
];

async function main() {
  const input = await readStdinJson();
  const command = input?.tool_input?.command;

  if (!command) {
    process.exit(0);
  }

  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      log(`BLOCKED: '${command}' matches dangerous pattern '${description}'. The user has prevented you from doing this.`);
      process.exit(2);
    }
  }

  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
