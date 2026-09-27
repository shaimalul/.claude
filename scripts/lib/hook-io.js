/**
 * Hook stdin and stderr I/O, per the hook contract at https://code.claude.com/docs/en/hooks
 */


/**
 * Read JSON from stdin (for hook input)
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        if (data.trim()) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (err) {
        reject(err);
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Log to stderr (visible to user in Claude Code)
 */
function log(message) {
  console.error(message);
}

module.exports = {
  readStdinJson,
  log
};
