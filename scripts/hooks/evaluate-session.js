#!/usr/bin/env node
/**
 * Continuous Learning - Session Evaluator
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop hook to detect extraction opportunities from Claude Code sessions.
 * Analyzes transcript for patterns indicating non-obvious discoveries.
 */

const path = require('path');
const fs = require('fs');
const { readFile, countInFile } = require('../lib/files');
const { readStdinJson, log } = require('../lib/hook-io');

// Patterns indicating extractable knowledge (debugging, discoveries, workarounds)
const EXTRACTION_TRIGGERS = [
  // Debugging success patterns
  /finally (fixed|solved|resolved|figured out)/i,
  /the (issue|problem|bug) was/i,
  /root cause (was|turned out to be)/i,
  /after (hours|much|lots of) (debugging|investigation)/i,

  // Discovery patterns
  /discovered that/i,
  /turns out (you need to|the|that)/i,
  /the trick (is|was)/i,
  /workaround (is|was|for)/i,

  // Non-obvious solution patterns
  /not obvious/i,
  /counter-?intuitive/i,
  /surprisingly/i,
  /unexpected(ly)?/i,
  /took a while to figure out/i,

  // Error resolution patterns
  /error.*was (caused by|due to)/i,
  /fix(ed)? (the|this) error/i,
  /solution.*was/i,
  /resolved by/i
];

// Patterns indicating routine work (should NOT be extracted)
const EXCLUSION_PATTERNS = [
  /documentation says/i,
  /according to (the )?(docs|documentation)/i,
  /straightforward/i,
  /simple (fix|change|update)/i,
  /just (need to|had to)/i,
  /as expected/i
];

/**
 * Count pattern matches in text
 */
function countPatternMatches(text, patterns) {
  const matches = patterns.map(pattern => text.match(pattern)).filter(Boolean).map(m => m[0].substring(0, 40));
  return { count: matches.length, matches };
}

const DEFAULTS = { minSessionLength: 10, qualityThreshold: 2 };
const PREFIX = '[ContinuousLearning]';

/** Thresholds from config/continuous-learning.json, falling back to defaults */
function loadThresholds() {
  const configFile = path.join(__dirname, '..', '..', 'config', 'continuous-learning.json');
  try {
    const config = JSON.parse(readFile(configFile) || '');
    return {
      minSessionLength: config.min_session_length || DEFAULTS.minSessionLength,
      qualityThreshold: config.extract_learning?.quality_threshold || DEFAULTS.qualityThreshold,
    };
  } catch {
    return DEFAULTS;
  }
}

function recommend(triggers, score, qualityThreshold) {
  if (score >= qualityThreshold) {
    log(`${PREFIX} ================================================`);
    log(`${PREFIX} RECOMMENDED: Run /extract-learning`);
    log(`${PREFIX} ================================================`);
    log(`${PREFIX} Detected patterns: ${triggers.matches.slice(0, 3).join(', ')}`);
    log(`${PREFIX} This session likely contains extractable knowledge.`);
  } else if (triggers.count > 0) {
    log(`${PREFIX} Consider /extract-learning if significant discoveries were made`);
    log(`${PREFIX} Score: ${score} (threshold: ${qualityThreshold})`);
  } else {
    log(`${PREFIX} Session appears routine, no extraction recommended`);
  }
}

async function main() {
  const { minSessionLength, qualityThreshold } = loadThresholds();

  // transcript_path arrives on the hook's stdin payload, not the environment.
  // See https://code.claude.com/docs/en/hooks
  const transcriptPath = (await readStdinJson())?.transcript_path;
  const transcript = transcriptPath && fs.existsSync(transcriptPath) ? readFile(transcriptPath) : null;
  if (!transcript) process.exit(0);

  const messageCount = countInFile(transcriptPath, /"type":"user"/g);
  if (messageCount < minSessionLength) {
    log(`${PREFIX} Session too short (${messageCount} messages), skipping evaluation`);
    process.exit(0);
  }

  const triggers = countPatternMatches(transcript, EXTRACTION_TRIGGERS);
  const exclusions = countPatternMatches(transcript, EXCLUSION_PATTERNS);
  log(`${PREFIX} Session analysis: ${messageCount} messages, ${triggers.count} triggers, ${exclusions.count} exclusions`);

  recommend(triggers, triggers.count - exclusions.count, qualityThreshold);
  log(`${PREFIX} Run /extract-learning to integrate patterns into existing domain skills`);
  process.exit(0);
}

main().catch(err => {
  console.error(`${PREFIX} Error:`, err.message);
  process.exit(0);
});
