/**
 * Throwaway $HOME for hook tests.
 *
 * os.homedir() honours $HOME on POSIX, so overriding HOME in a spawned hook's
 * environment redirects every getClaudeDir()/getSessionsDir() call into the
 * sandbox. Real ~/.claude state is never touched.
 *
 * Directories a hook only READS (templates, skills) are symlinked to the real
 * ones so tests exercise genuine content; anything a hook WRITES stays inside
 * the sandbox.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');

const REAL_CLAUDE_DIR = path.join(__dirname, '..', '..');
const DEFAULT_LINKS = ['templates'];

/** Symlink a real config directory into the sandbox for read-only use */
function linkDir(claudeDir, name) {
  const source = path.join(REAL_CLAUDE_DIR, name);
  if (!fs.existsSync(source)) return;
  fs.symlinkSync(source, path.join(claudeDir, name), 'dir');
}

/** Copy a real config directory so a test can overwrite files inside it */
function copyDir(claudeDir, name) {
  const source = path.join(REAL_CLAUDE_DIR, name);
  if (!fs.existsSync(source)) return;
  const target = path.join(claudeDir, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

/**
 * Create an isolated sandbox home.
 * @param {{link?: string[], copy?: string[], sessionId?: string}} options
 */
function createSandbox(options = {}) {
  const { link = DEFAULT_LINKS, copy = [], sessionId = randomUUID() } = options;

  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-hook-test-'));
  const claudeDir = path.join(home, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });

  link.forEach(name => linkDir(claudeDir, name));
  copy.forEach(name => copyDir(claudeDir, name));

  return {
    home,
    claudeDir,
    sessionId,
    env: { ...process.env, HOME: home, USERPROFILE: home },
    path: (...parts) => path.join(claudeDir, ...parts),
    write(relativePath, contents) {
      const target = path.join(claudeDir, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents);
      return target;
    },
    read(relativePath) {
      const target = path.join(claudeDir, relativePath);
      return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    },
    exists(relativePath) {
      return fs.existsSync(path.join(claudeDir, relativePath));
    },
    cleanup() {
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

module.exports = { createSandbox, REAL_CLAUDE_DIR };
