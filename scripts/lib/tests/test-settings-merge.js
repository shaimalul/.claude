/**
 * Tests for scripts/lib/settings-merge.js
 *
 * Run: node --test scripts/lib/tests/test-settings-merge.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { mergeSettings, getHookIdentity, getEntryIdentity } = require(
  path.join(__dirname, '..', 'settings-merge.js')
);

const HOME = '/home/testuser';

// ── getHookIdentity ────────────────────────────────────────

describe('getHookIdentity', () => {
  it('strips "node " runner prefix', () => {
    const result = getHookIdentity('node scripts/hooks/my-hook.js', HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('strips "bash " runner prefix', () => {
    const result = getHookIdentity('bash scripts/hooks/run.sh', HOME);
    assert.strictEqual(result, 'scripts/hooks/run.sh');
  });

  it('strips "python3 " runner prefix', () => {
    const result = getHookIdentity('python3 scripts/hooks/hook.py', HOME);
    assert.strictEqual(result, 'scripts/hooks/hook.py');
  });

  it('strips "python " runner prefix', () => {
    const result = getHookIdentity('python scripts/hooks/hook.py', HOME);
    assert.strictEqual(result, 'scripts/hooks/hook.py');
  });

  it('strips "sh " runner prefix', () => {
    const result = getHookIdentity('sh scripts/hooks/run.sh', HOME);
    assert.strictEqual(result, 'scripts/hooks/run.sh');
  });

  it('strips home dir prefix with actual home value', () => {
    const result = getHookIdentity(`${HOME}/.claude/scripts/hooks/my-hook.js`, HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('strips __HOME__/.claude/ template prefix', () => {
    const result = getHookIdentity('__HOME__/.claude/scripts/hooks/my-hook.js', HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('strips runner AND home dir prefix together', () => {
    const result = getHookIdentity(`node ${HOME}/.claude/scripts/hooks/my-hook.js`, HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('strips runner AND __HOME__ prefix together', () => {
    const result = getHookIdentity('node __HOME__/.claude/scripts/hooks/my-hook.js', HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('maps legacy notify-wrapper.sh to the notify sound hook', () => {
    const result = getHookIdentity('bash scripts/hooks/notify-wrapper.sh', HOME);
    assert.strictEqual(result, 'scripts/hooks/play-sound.sh notify');
  });

  it('maps a bare notifier invocation to the notify sound hook', () => {
    const result = getHookIdentity('bash plugins/claude-notifier-plugin/scripts/notify.sh', HOME);
    assert.strictEqual(result, 'scripts/hooks/play-sound.sh notify');
  });

  it('maps argument-less play-sound.sh to the done sound hook', () => {
    const result = getHookIdentity('bash scripts/hooks/play-sound.sh', HOME);
    assert.strictEqual(result, 'scripts/hooks/play-sound.sh done');
  });

  it('maps a legacy afplay command to the done sound hook', () => {
    const result = getHookIdentity('afplay /System/Library/Sounds/Submarine.aiff', HOME);
    assert.strictEqual(result, 'scripts/hooks/play-sound.sh done');
  });

  it('keeps done and notify sounds as distinct identities', () => {
    const done = getHookIdentity('bash __HOME__/.claude/scripts/hooks/play-sound.sh done', HOME);
    const notify = getHookIdentity('bash __HOME__/.claude/scripts/hooks/play-sound.sh notify', HOME);
    assert.notStrictEqual(done, notify);
  });

  it('returns command unchanged when no prefix matches', () => {
    const result = getHookIdentity('some-other-command --flag', HOME);
    assert.strictEqual(result, 'some-other-command --flag');
  });

  it('strips literal ~/.claude/ prefix', () => {
    const result = getHookIdentity('node ~/.claude/scripts/hooks/my-hook.js', HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('treats ~/.claude/ and resolved home dir paths as the same identity', () => {
    const tilde = getHookIdentity('node ~/.claude/scripts/hooks/my-hook.js', HOME);
    const resolved = getHookIdentity(`node ${HOME}/.claude/scripts/hooks/my-hook.js`, HOME);
    assert.strictEqual(tilde, resolved);
  });
});

// ── getEntryIdentity ───────────────────────────────────────

describe('getEntryIdentity', () => {
  it('extracts identity from first hook command', () => {
    const entry = {
      hooks: [{ command: `node ${HOME}/.claude/scripts/hooks/my-hook.js` }]
    };
    const result = getEntryIdentity(entry, HOME);
    assert.strictEqual(result, 'scripts/hooks/my-hook.js');
  });

  it('returns null for empty hooks array', () => {
    const entry = { hooks: [] };
    const result = getEntryIdentity(entry, HOME);
    assert.strictEqual(result, null);
  });

  it('returns null when hooks key is missing', () => {
    const entry = {};
    const result = getEntryIdentity(entry, HOME);
    assert.strictEqual(result, null);
  });

  it('returns null when first hook has no command', () => {
    const entry = { hooks: [{}] };
    const result = getEntryIdentity(entry, HOME);
    assert.strictEqual(result, null);
  });

  it('uses only the first hook command for identity', () => {
    const entry = {
      hooks: [
        { command: 'node scripts/hooks/first.js' },
        { command: 'node scripts/hooks/second.js' }
      ]
    };
    const result = getEntryIdentity(entry, HOME);
    assert.strictEqual(result, 'scripts/hooks/first.js');
  });
});

// ── mergePermissions (via mergeSettings) ──────────────────

describe('mergePermissions', () => {
  it('unions allow arrays from template and user', () => {
    const template = { permissions: { allow: ['Read', 'Write'] } };
    const existing = { permissions: { allow: ['Bash'] } };
    const result = mergeSettings(template, existing, HOME);
    const allow = result.permissions.allow.sort();
    assert.deepStrictEqual(allow, ['Bash', 'Read', 'Write']);
  });

  it('deduplicates allow entries present in both', () => {
    const template = { permissions: { allow: ['Read', 'Write'] } };
    const existing = { permissions: { allow: ['Read', 'Bash'] } };
    const result = mergeSettings(template, existing, HOME);
    const allow = result.permissions.allow.sort();
    assert.deepStrictEqual(allow, ['Bash', 'Read', 'Write']);
  });

  it('user defaultMode wins over template', () => {
    const template = { permissions: { defaultMode: 'auto', allow: [] } };
    const existing = { permissions: { defaultMode: 'bypassPermissions', allow: [] } };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.permissions.defaultMode, 'bypassPermissions');
  });

  it('template defaultMode used when user has none', () => {
    const template = { permissions: { defaultMode: 'auto', allow: [] } };
    const existing = { permissions: { allow: [] } };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.permissions.defaultMode, 'auto');
  });

  it('copies template permissions when user has none', () => {
    const template = { permissions: { defaultMode: 'auto', allow: ['Read'] } };
    const existing = {};
    const result = mergeSettings(template, existing, HOME);
    assert.deepStrictEqual(result.permissions, { defaultMode: 'auto', allow: ['Read'] });
  });

  it('no mutation of input objects', () => {
    const template = { permissions: { allow: ['Read'] } };
    const existing = { permissions: { allow: ['Bash'] } };
    mergeSettings(template, existing, HOME);
    assert.deepStrictEqual(existing.permissions.allow, ['Bash']);
    assert.deepStrictEqual(template.permissions.allow, ['Read']);
  });
});

// ── mergeHooks (via mergeSettings) ────────────────────────

describe('mergeHooks', () => {
  it('adds new template hooks not present in user settings', () => {
    const template = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/new-hook.js' }] }
        ]
      }
    };
    const existing = {};
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.PostToolUse.length, 1);
    assert.strictEqual(result.hooks.PostToolUse[0].hooks[0].command, 'node scripts/hooks/new-hook.js');
  });

  it('preserves existing user hooks', () => {
    const template = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/template-hook.js' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/user-hook.js' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    const commands = result.hooks.PostToolUse.map(e => e.hooks[0].command);
    assert.ok(commands.includes('node scripts/hooks/user-hook.js'), 'user hook preserved');
    assert.ok(commands.includes('node scripts/hooks/template-hook.js'), 'template hook added');
  });

  it('deduplicates by identity - does not add hook already present', () => {
    const template = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/shared-hook.js' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/shared-hook.js' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.PostToolUse.length, 1);
  });

  it('deduplicates a legacy notification hook against its replacement', () => {
    const template = {
      hooks: {
        Stop: [
          { hooks: [{ command: 'bash scripts/hooks/play-sound.sh notify' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        Stop: [
          { hooks: [{ command: 'bash scripts/hooks/notify-wrapper.sh' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.Stop.length, 1);
  });

  it('adds hooks for new event type not in user settings', () => {
    const template = {
      hooks: {
        PreToolUse: [
          { hooks: [{ command: 'node scripts/hooks/pre-hook.js' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/post-hook.js' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.ok(result.hooks.PreToolUse, 'new event type added');
    assert.ok(result.hooks.PostToolUse, 'existing event type preserved');
    assert.strictEqual(result.hooks.PreToolUse.length, 1);
    assert.strictEqual(result.hooks.PostToolUse.length, 1);
  });

  it('copies template hooks when user has no hooks at all', () => {
    const template = {
      hooks: {
        Stop: [
          { hooks: [{ command: 'node scripts/hooks/stop-hook.js' }] }
        ]
      }
    };
    const existing = {};
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.Stop.length, 1);
  });

  it('deduplicates a ~/.claude/ hook against its __HOME__-resolved template counterpart', () => {
    const template = {
      hooks: {
        SessionStart: [
          { hooks: [{ command: `node ${HOME}/.claude/scripts/hooks/session-start.js` }] }
        ]
      }
    };
    const existing = {
      hooks: {
        SessionStart: [
          { hooks: [{ command: 'node ~/.claude/scripts/hooks/session-start.js' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.SessionStart.length, 1);
  });

  it('drops an orphaned hook under a renamed event once its replacement is present under the new event', () => {
    const template = {
      hooks: {
        Notification: [
          { hooks: [{ command: 'bash scripts/hooks/play-sound.sh notify' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        PermissionRequest: [
          { hooks: [{ command: 'bash plugins/claude-notifier-plugin/scripts/notify.sh' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.PermissionRequest, undefined, 'legacy event removed');
    assert.strictEqual(result.hooks.Notification.length, 1, 'replacement hook added');
  });

  it('preserves a hook under an event type the template does not know about at all', () => {
    const template = { hooks: { Notification: [] } };
    const existing = {
      hooks: {
        CustomUserEvent: [
          { hooks: [{ command: 'node scripts/hooks/my-custom-hook.js' }] }
        ]
      }
    };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.hooks.CustomUserEvent.length, 1);
  });

  it('no mutation of input hook arrays', () => {
    const template = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/template-hook.js' }] }
        ]
      }
    };
    const existing = {
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/user-hook.js' }] }
        ]
      }
    };
    const originalLength = existing.hooks.PostToolUse.length;
    mergeSettings(template, existing, HOME);
    assert.strictEqual(existing.hooks.PostToolUse.length, originalLength);
  });
});

// ── mergeSettings (full integration) ──────────────────────

describe('mergeSettings', () => {
  it('preserves user-only top-level keys', () => {
    const template = { someNewKey: 'from-template' };
    const existing = { feedbackSurveyState: { dismissed: true }, userOnlyKey: 42 };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.feedbackSurveyState.dismissed, true);
    assert.strictEqual(result.userOnlyKey, 42);
  });

  it('adds new top-level keys from template when missing in user', () => {
    const template = { newFeatureFlag: true, anotherKey: 'hello' };
    const existing = {};
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.newFeatureFlag, true);
    assert.strictEqual(result.anotherKey, 'hello');
  });

  it('does not override existing user top-level keys', () => {
    const template = { sharedKey: 'template-value' };
    const existing = { sharedKey: 'user-value' };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result.sharedKey, 'user-value');
  });

  it('always updates $schema from template', () => {
    const template = { $schema: 'https://example.com/schema/v2.json' };
    const existing = { $schema: 'https://example.com/schema/v1.json' };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result['$schema'], 'https://example.com/schema/v2.json');
  });

  it('adds $schema when user settings has none', () => {
    const template = { $schema: 'https://example.com/schema/v2.json' };
    const existing = {};
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result['$schema'], 'https://example.com/schema/v2.json');
  });

  it('skips $schema update when template has no $schema', () => {
    const template = { someKey: 'val' };
    const existing = { $schema: 'https://example.com/schema/v1.json' };
    const result = mergeSettings(template, existing, HOME);
    assert.strictEqual(result['$schema'], 'https://example.com/schema/v1.json');
  });

  it('full integration - combines permissions, hooks, schema and keys', () => {
    const template = {
      $schema: 'https://example.com/schema/v2.json',
      permissions: {
        defaultMode: 'auto',
        allow: ['Read', 'Write']
      },
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/new-hook.js' }] }
        ]
      },
      templateOnlyKey: 'added'
    };
    const existing = {
      $schema: 'https://example.com/schema/v1.json',
      permissions: {
        defaultMode: 'bypassPermissions',
        allow: ['Bash']
      },
      hooks: {
        PostToolUse: [
          { hooks: [{ command: 'node scripts/hooks/user-hook.js' }] }
        ]
      },
      userOnlyKey: 'preserved',
      sharedKey: 'user-wins'
    };

    const result = mergeSettings(template, existing, HOME);

    assert.strictEqual(result['$schema'], 'https://example.com/schema/v2.json');
    assert.strictEqual(result.permissions.defaultMode, 'bypassPermissions');
    const allow = result.permissions.allow.sort();
    assert.deepStrictEqual(allow, ['Bash', 'Read', 'Write']);
    const commands = result.hooks.PostToolUse.map(e => e.hooks[0].command);
    assert.ok(commands.includes('node scripts/hooks/user-hook.js'));
    assert.ok(commands.includes('node scripts/hooks/new-hook.js'));
    assert.strictEqual(result.userOnlyKey, 'preserved');
    assert.strictEqual(result.templateOnlyKey, 'added');
  });

  it('does not mutate the existing input object', () => {
    const template = {
      permissions: { allow: ['Read'] },
      hooks: { PostToolUse: [{ hooks: [{ command: 'node scripts/hooks/t.js' }] }] }
    };
    const existing = {
      permissions: { allow: ['Bash'] },
      hooks: { PostToolUse: [{ hooks: [{ command: 'node scripts/hooks/u.js' }] }] }
    };
    const existingCopy = JSON.parse(JSON.stringify(existing));
    mergeSettings(template, existing, HOME);
    assert.deepStrictEqual(existing, existingCopy);
  });
});
