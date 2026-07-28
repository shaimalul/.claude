/**
 * Synthetic transcript JSONL for hook tests.
 *
 * The transcript format is internal to Claude Code, so these fixtures only
 * reproduce the shape the evaluate-* hooks actually depend on: a flat
 * `"type":"user"` count for session length, and free text for pattern scoring.
 * Hooks needing the final assistant text should read `last_assistant_message`
 * off the Stop payload instead - see lib/hook-payload.js.
 */

const fs = require('fs');
const path = require('path');

/** One user entry, matching the `"type":"user"` shape the hooks count */
function userLine(text) {
  return JSON.stringify({ type: 'user', message: { role: 'user', content: text } });
}

/** One assistant entry with a single text block */
function assistantLine(text) {
  return JSON.stringify({
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'text', text }] },
  });
}

/**
 * Build a transcript.
 * @param {{userMessages?: number, assistantTexts?: string[], extraText?: string,
 *          malformedTail?: boolean}} spec
 */
function buildTranscript(spec = {}) {
  const { userMessages = 12, assistantTexts = [], extraText = '', malformedTail = false } = spec;

  const lines = [];
  for (let i = 0; i < userMessages; i += 1) {
    const body = i === 0 && extraText ? extraText : `user message ${i + 1}`;
    lines.push(userLine(body));
  }
  assistantTexts.forEach(text => lines.push(assistantLine(text)));
  if (malformedTail) lines.push('{ this is not valid json');

  return `${lines.join('\n')}\n`;
}

/** Write a transcript into `dir` and return its path */
function writeTranscript(dir, spec = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(filePath, buildTranscript(spec));
  return filePath;
}

/** Text containing `count` distinct extraction-trigger phrases */
function triggerText(count) {
  const phrases = [
    'the issue was a stale cache entry',
    'turns out you need to flush before reading',
    'root cause was an unawaited promise',
    'discovered that the retry loop swallowed errors',
    'the trick is to pin the resolver version',
  ];
  return phrases.slice(0, count).join('. ');
}

/** Text containing `count` distinct exclusion phrases */
function exclusionText(count) {
  const phrases = [
    'the documentation says so',
    'this was straightforward',
    'a simple fix really',
    'just need to bump the version',
    'it behaved as expected',
  ];
  return phrases.slice(0, count).join('. ');
}

module.exports = {
  buildTranscript,
  writeTranscript,
  triggerText,
  exclusionText,
  userLine,
  assistantLine,
};
