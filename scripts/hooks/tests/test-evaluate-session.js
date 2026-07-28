/**
 * HK-ES: evaluate-session.js - continuous learning detector.
 * Contract: Stop hook, advisory only. Never blocks, always exits 0.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { runHook } = require('../../lib/hook-harness');
const { createSandbox } = require('../../lib/sandbox');
const { stop } = require('../../lib/hook-payload');
const { writeTranscript, triggerText, exclusionText } = require('../../lib/transcript-fixture');

const HOOK = path.join(__dirname, '..', 'evaluate-session.js');

describe('HK-ES evaluate-session', () => {
  let sandbox;

  before(() => {
    sandbox = createSandbox();
  });
  after(() => sandbox.cleanup());

  /** Run the hook with the transcript supplied BOTH ways: env var and stdin. */
  const runBoth = transcriptPath =>
    runHook(HOOK, {
      stdin: stop('', { transcript_path: transcriptPath }),
      env: { ...sandbox.env, CLAUDE_TRANSCRIPT_PATH: transcriptPath },
    });

  test('HK-ES-01 recommends extraction on a long session with several triggers', async () => {
    const transcript = writeTranscript(sandbox.home, {
      userMessages: 12,
      extraText: triggerText(4),
    });
    const { code, stderr } = await runBoth(transcript);

    assert.strictEqual(code, 0, 'advisory hook must never block');
    assert.match(stderr, /RECOMMENDED: Run \/extract-learning/);
  });

  test('HK-ES-02 only weakly suggests when score is below threshold', async () => {
    const transcript = writeTranscript(sandbox.home, {
      userMessages: 12,
      extraText: triggerText(1),
    });
    const { stderr } = await runBoth(transcript);

    assert.match(stderr, /Consider \/extract-learning/);
    assert.doesNotMatch(stderr, /RECOMMENDED/);
  });

  test('HK-ES-03 exclusions cancel triggers out', async () => {
    const transcript = writeTranscript(sandbox.home, {
      userMessages: 12,
      extraText: `${triggerText(3)}. ${exclusionText(4)}`,
    });
    const { stderr } = await runBoth(transcript);

    assert.doesNotMatch(stderr, /RECOMMENDED/);
  });

  test('HK-ES-04 stays silent on a routine session with no triggers', async () => {
    const transcript = writeTranscript(sandbox.home, { userMessages: 12 });
    const { stderr } = await runBoth(transcript);

    assert.match(stderr, /Session appears routine/);
  });

  test('HK-ES-05 skips sessions shorter than the minimum', async () => {
    const transcript = writeTranscript(sandbox.home, {
      userMessages: 4,
      extraText: triggerText(4),
    });
    const { code, stderr } = await runBoth(transcript);

    assert.strictEqual(code, 0);
    assert.match(stderr, /Session too short \(4 messages\)/);
  });

  test('HK-ES-06 exits quietly when no transcript exists', async () => {
    const { code, stderr } = await runHook(HOOK, { stdin: stop(''), env: sandbox.env });

    assert.strictEqual(code, 0);
    assert.strictEqual(stderr.trim(), '');
  });

  test('HK-ES-07 tolerates a missing transcript file without crashing', async () => {
    const missing = path.join(sandbox.home, 'does-not-exist.jsonl');
    const { code } = await runBoth(missing);

    assert.strictEqual(code, 0);
  });

  // D-01 regression proof: transcript_path is a stdin field, not an env var.
  // Red until the hook stops reading process.env.CLAUDE_TRANSCRIPT_PATH.
  test('HK-ES-08 scores using transcript_path from stdin alone', async () => {
    const transcript = writeTranscript(sandbox.home, {
      userMessages: 12,
      extraText: triggerText(4),
    });
    const { stderr } = await runHook(HOOK, {
      stdin: stop('', { transcript_path: transcript }),
      env: sandbox.env,
    });

    assert.match(stderr, /RECOMMENDED: Run \/extract-learning/);
  });
});
