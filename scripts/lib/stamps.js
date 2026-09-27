/**
 * Date, time, and session stamps used in generated filenames
 */


/**
 * Get current date in YYYY-MM-DD format
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format
 */
function getTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Shorten a session ID to its last 8 characters for use in filenames.
 *
 * The session ID arrives on the hook's stdin payload as `session_id`; there is
 * no environment variable carrying it. See https://code.claude.com/docs/en/hooks
 *
 * @param {string} sessionId - session_id from the hook payload
 * @param {string} fallback - Value to use when no session ID was supplied
 */
function getSessionIdShort(sessionId, fallback = 'default') {
  if (!sessionId || sessionId.length === 0) {
    return fallback;
  }
  return sessionId.slice(-8);
}

module.exports = {
  getDateString,
  getTimeString,
  getSessionIdShort
};
