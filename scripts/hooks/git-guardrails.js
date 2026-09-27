#!/usr/bin/env node
/**
 * Guardrails Hook
 *
 * PreToolUse hook that blocks destructive operations before execution.
 * Covers: git, terraform, kubectl, AWS CLI, and filesystem commands.
 *
 * Exit code 2 = block the command
 * Exit code 0 = allow the command
 */

const { readStdinJson, log } = require('../lib/hook-io');

const DANGEROUS_PATTERNS = [
  { pattern: /\bgit\s+push\b/, description: 'git push' },
  { pattern: /\bgit\s+reset\s+--hard\b/, description: 'git reset --hard' },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, description: 'git clean -f' },
  { pattern: /\bgit\s+branch\s+-D\b/, description: 'git branch -D' },
  { pattern: /\bgit\s+checkout\s+\.\s*$/, description: 'git checkout .' },
  { pattern: /\bgit\s+restore\s+\.\s*$/, description: 'git restore .' },
  { pattern: /\bterraform\s+state\s+rm\b/, description: 'terraform state rm' },
  { pattern: /\bterraform\s+state\s+mv\b/, description: 'terraform state mv' },
  { pattern: /\bterraform\s+apply\b/, description: 'terraform apply' },
  { pattern: /\bterraform\s+destroy\b/, description: 'terraform destroy' },
  { pattern: /\bterraform\s+force-unlock\b/, description: 'terraform force-unlock' },
  { pattern: /\bhelm\s+upgrade\b/, description: 'helm upgrade' },
  { pattern: /\bhelm\s+rollback\b/, description: 'helm rollback' },
  { pattern: /\bkubectl\s+apply\b/, description: 'kubectl apply' },
  { pattern: /\bkubectl\s+delete\b/, description: 'kubectl delete' },
  { pattern: /\bkubectl\s+rollout\s+restart\b/, description: 'kubectl rollout restart' },
  { pattern: /\bkubectl\s+drain\b/, description: 'kubectl drain' },
  { pattern: /\bkubectl\s+scale\b/, description: 'kubectl scale' },
  { pattern: /\bkubectl\s+cordon\b/, description: 'kubectl cordon' },
  { pattern: /\bkubectl\s+taint\b/, description: 'kubectl taint' },
  { pattern: /\baws\b.*\bdelete\b/, description: 'aws * delete' },
  { pattern: /\baws\b.*\bremove\b/, description: 'aws * remove' },
  { pattern: /\baws\b.*\bderegister\b/, description: 'aws * deregister' },
  { pattern: /\baws\b.*\bterminate\b/, description: 'aws * terminate' },
];

// A shell that evaluates its string argument turns quoted text back into a command.
const EVALUATES_QUOTED_TEXT = /\b(?:(?:ba|z|da|k)?sh\s+(?:-\w+\s+)*-\w*c\b|eval\b|ssh\b|su\b.*\s-c\b)/;
const SINGLE_QUOTED = /'[^']*'/g;
const DOUBLE_QUOTED = /"(?:[^"\\]|\\.)*"/g;
const SUBSTITUTION = /\$\(|`/;

/**
 * The part of a command the shell will run. Quoted arguments are data and are
 * dropped, except when a shell re-evaluates them or they hold a substitution.
 */
function executableText(command) {
  if (EVALUATES_QUOTED_TEXT.test(command)) return command;
  return command
    .replace(SINGLE_QUOTED, "''")
    .replace(DOUBLE_QUOTED, quoted => (SUBSTITUTION.test(quoted) ? quoted : '""'));
}

async function main() {
  const input = await readStdinJson();
  const command = input?.tool_input?.command;

  if (!command) {
    process.exit(0);
  }

  const executable = executableText(command);

  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(executable)) {
      log(`BLOCKED: '${command}' matches dangerous pattern '${description}'. The user has prevented you from doing this.`);
      process.exit(2);
    }
  }

  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
