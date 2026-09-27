/**
 * HK-GG: git-guardrails.js - blocks destructive shell commands.
 * Contract: PreToolUse on Bash. Exit 2 blocks and feeds stderr back to Claude.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { runHook } = require('../../lib/hook-harness');
const { preToolUse } = require('../../lib/hook-payload');

const HOOK = path.join(__dirname, '..', 'git-guardrails.js');

const run = command => runHook(HOOK, { stdin: preToolUse('Bash', { command }) });

// One realistic invocation per DANGEROUS_PATTERNS entry.
const BLOCKED = [
  ['git push --force-with-lease origin feat/x', 'git push'],
  ['git reset --hard origin/main', 'git reset --hard'],
  ['git clean -fd', 'git clean -f'],
  ['git branch -D stale/branch', 'git branch -D'],
  ['git checkout .', 'git checkout .'],
  ['git restore .', 'git restore .'],
  ['terraform state rm aws_s3_bucket.logs', 'terraform state rm'],
  ['terraform state mv aws_s3_bucket.a aws_s3_bucket.b', 'terraform state mv'],
  ['terraform apply -auto-approve', 'terraform apply'],
  ['terraform destroy', 'terraform destroy'],
  ['terraform force-unlock 1234', 'terraform force-unlock'],
  ['helm upgrade api ./chart', 'helm upgrade'],
  ['helm rollback api 3', 'helm rollback'],
  ['kubectl apply -f deploy.yaml', 'kubectl apply'],
  ['kubectl delete pod api-0 -n prod', 'kubectl delete'],
  ['kubectl rollout restart deploy/api', 'kubectl rollout restart'],
  ['kubectl drain node-1', 'kubectl drain'],
  ['kubectl scale deploy/api --replicas=0', 'kubectl scale'],
  ['kubectl cordon node-1', 'kubectl cordon'],
  ['kubectl taint nodes node-1 key=value:NoSchedule', 'kubectl taint'],
  ['aws s3 rm s3://bucket/key --delete', 'aws * delete'],
  ['aws ec2 remove-tags --resources i-abc', 'aws * remove'],
  ['aws ecs deregister-task-definition --task-definition t:1', 'aws * deregister'],
  ['aws ec2 terminate-instances --instance-ids i-abc', 'aws * terminate'],
];

const ALLOWED = [
  'git status',
  'git log --oneline -20',
  'terraform plan',
  'kubectl get pods -n prod',
  'npm test',
  'aws s3 ls s3://build-artifacts/',
];

describe('HK-GG git-guardrails', () => {
  BLOCKED.forEach(([command, description], index) => {
    const id = String(index + 1).padStart(2, '0');
    test(`HK-GG-${id} blocks ${description}`, async () => {
      const { code, stderr } = await run(command);

      assert.strictEqual(code, 2, `expected exit 2 for: ${command}`);
      assert.match(stderr, /^BLOCKED:/m);
      assert.ok(stderr.includes(description), `stderr should name the pattern '${description}'`);
    });
  });

  ALLOWED.forEach((command, index) => {
    const id = String(index + 25).padStart(2, '0');
    test(`HK-GG-${id} allows: ${command}`, async () => {
      const { code } = await run(command);
      assert.strictEqual(code, 0, `expected exit 0 for: ${command}`);
    });
  });

  test('HK-GG-31 allows a payload with no command', async () => {
    const { code } = await runHook(HOOK, { stdin: preToolUse('Bash', {}) });
    assert.strictEqual(code, 0);
  });

  test('HK-GG-32 fails open on malformed stdin', async () => {
    const { code } = await runHook(HOOK, { stdin: undefined });
    assert.strictEqual(code, 0);
  });

  // D-18: quoted text is data, not a command, so a dangerous verb inside it is allowed.
  test('HK-GG-33 allows a git verb inside a quoted string', async () => {
    const { code } = await run('echo "remember not to git push yet"');
    assert.strictEqual(code, 0, 'D-18: substring match blocks a harmless echo');
  });

  test('HK-GG-34 word boundaries keep "deleted" in a bucket name from matching', async () => {
    const { code } = await run('aws s3 ls s3://my-deleted-backups/');
    assert.strictEqual(code, 0);
  });

  // Quoted text still runs when a shell evaluates it, so stripping quotes must never open a bypass.
  const QUOTED_BUT_EXECUTED = [
    ['bash -c "git push origin main"', 'shell -c argument'],
    ["sh -c 'git reset --hard'", 'single-quoted shell -c argument'],
    ['eval "git push"', 'eval argument'],
    ['echo "$(git push)"', 'command substitution inside double quotes'],
    ['echo "`git push`"', 'backtick substitution inside double quotes'],
    ['git commit -m "wip" && git push', 'a real command after a quoted argument'],
  ];

  QUOTED_BUT_EXECUTED.forEach(([command, label], index) => {
    const id = String(index + 35).padStart(2, '0');
    test(`HK-GG-${id} still blocks ${label}`, async () => {
      const { code } = await run(command);
      assert.strictEqual(code, 2, `expected exit 2 for: ${command}`);
    });
  });

  test('HK-GG-41 allows a commit message that mentions a dangerous verb', async () => {
    const { code } = await run('git commit -m "docs: explain why we never git push --force"');
    assert.strictEqual(code, 0);
  });

  test('HK-GG-42 allows a dangerous verb inside single quotes', async () => {
    const { code } = await run("grep -rn 'kubectl delete' docs/");
    assert.strictEqual(code, 0);
  });
});
