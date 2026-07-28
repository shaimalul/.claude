/**
 * Spawns a hook as a child process and captures the three signals a hook
 * can emit per the hooks contract: exit code, stderr, and stdout JSON.
 *
 * Exit 0 = success (stdout parsed as JSON decision).
 * Exit 2 = blocking error (stderr fed back to Claude, stdout ignored).
 * Anything else = non-blocking error.
 */

const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 5000;

/** Collect a readable stream into a string */
function collect(stream) {
  let buffer = '';
  stream.on('data', chunk => {
    buffer += chunk;
  });
  return () => buffer;
}

/** Parse stdout as JSON, returning null when it is not JSON */
function parseJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/** Run a command, writing `stdin` as JSON, and resolve its captured signals */
function run(command, args, { stdin, env, cwd, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: env || process.env,
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const readStdout = collect(child.stdout);
    const readStderr = collect(child.stderr);

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Hook timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', code => {
      clearTimeout(timer);
      const stdout = readStdout();
      resolve({ code, stdout, stderr: readStderr(), json: parseJson(stdout) });
    });

    child.stdin.on('error', () => {});
    child.stdin.end(stdin === undefined ? '' : JSON.stringify(stdin));
  });
}

/** Run a Node hook script */
function runHook(scriptPath, options = {}) {
  return run('node', [scriptPath], options);
}

/** Run a shell hook script */
function runShellHook(scriptPath, options = {}) {
  return run('bash', [scriptPath], options);
}

module.exports = { runHook, runShellHook, DEFAULT_TIMEOUT_MS };
