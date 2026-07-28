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
const {
  readFile,
  countInFile,
  readStdinJson,
  log
} = require('../lib/utils');

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
  let count = 0;
  const matches = [];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
      // Get a snippet of the pattern for logging
      const match = text.match(pattern);
      if (match) {
        matches.push(match[0].substring(0, 40));
      }
    }
  }

  return { count, matches };
}

async function main() {
  // Get script directory to find config
  const scriptDir = __dirname;
  const configFile = path.join(scriptDir, '..', '..', 'config', 'continuous-learning.json');

  // Default configuration
  let minSessionLength = 10;
  let qualityThreshold = 2;

  // Load config if exists
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      const config = JSON.parse(configContent);
      minSessionLength = config.min_session_length || 10;
      qualityThreshold = config.extract_learning?.quality_threshold || 2;
    } catch {
      // Invalid config, use defaults
    }
  }

  // transcript_path arrives on the hook's stdin payload, not the environment.
  // See https://code.claude.com/docs/en/hooks
  const hookInput = await readStdinJson();
  const transcriptPath = hookInput?.transcript_path;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // Read transcript content
  const transcriptContent = readFile(transcriptPath);
  if (!transcriptContent) {
    process.exit(0);
  }

  // Count user messages in session
  const messageCount = countInFile(transcriptPath, /"type":"user"/g);

  // Skip short sessions
  if (messageCount < minSessionLength) {
    log(`[ContinuousLearning] Session too short (${messageCount} messages), skipping evaluation`);
    process.exit(0);
  }

  // Analyze transcript for extraction triggers
  const triggers = countPatternMatches(transcriptContent, EXTRACTION_TRIGGERS);
  const exclusions = countPatternMatches(transcriptContent, EXCLUSION_PATTERNS);

  // Calculate extraction score
  const extractionScore = triggers.count - exclusions.count;

  // Log analysis results
  log(`[ContinuousLearning] Session analysis: ${messageCount} messages, ${triggers.count} triggers, ${exclusions.count} exclusions`);

  if (extractionScore >= qualityThreshold) {
    // Strong recommendation
    log(`[ContinuousLearning] ================================================`);
    log(`[ContinuousLearning] RECOMMENDED: Run /extract-learning`);
    log(`[ContinuousLearning] ================================================`);
    log(`[ContinuousLearning] Detected patterns: ${triggers.matches.slice(0, 3).join(', ')}`);
    log(`[ContinuousLearning] This session likely contains extractable knowledge.`);
  } else if (triggers.count > 0) {
    // Weak suggestion
    log(`[ContinuousLearning] Consider /extract-learning if significant discoveries were made`);
    log(`[ContinuousLearning] Score: ${extractionScore} (threshold: ${qualityThreshold})`);
  } else {
    // No recommendation
    log(`[ContinuousLearning] Session appears routine, no extraction recommended`);
  }

  log(`[ContinuousLearning] Run /extract-learning to integrate patterns into existing domain skills`);

  process.exit(0);
}

main().catch(err => {
  console.error('[ContinuousLearning] Error:', err.message);
  process.exit(0);
});
