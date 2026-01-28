#!/usr/bin/env node
/**
 * Code Cleanup - Session Evaluator
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop hook to detect cleanup opportunities from Claude Code sessions.
 * Analyzes transcript for patterns indicating code debt accumulation.
 */

const path = require('path');
const fs = require('fs');
const {
  readFile,
  countInFile,
  log
} = require('../lib/utils');

// Patterns indicating code debt accumulation
const CLEANUP_TRIGGERS = [
  // Duplicate type patterns
  /creating (a |new )?(type|interface|enum)/i,
  /defining (a |new )?(type|interface)/i,
  /added (a |new )?(type|interface|enum)/i,
  /similar (type|interface) (to|as|like)/i,

  // Multiple approach patterns
  /another way to/i,
  /alternative (approach|method|way|implementation)/i,
  /can also (use|do|implement)/i,
  /keeping (both|the old|existing)/i,
  /both (methods|approaches|ways) work/i,
  /either (way|approach|method) works/i,

  // Backward compatibility patterns
  /backward compat/i,
  /backwards? compatible/i,
  /legacy (support|code|approach|mode)/i,
  /deprecated but kept/i,
  /alias for/i,
  /re-?export(ing|s)?( for)?/i,
  /keeping for compatibility/i,
  /old (api|interface|method) still works/i,

  // Dead code indicators
  /no longer (used|needed|required)/i,
  /unused (but|export|function|variable|code)/i,
  /keeping (for now|just in case|temporarily)/i,
  /commented out (code|the|this)/i,
  /might need (later|this|it)/i,
  /not using (this|it) (anymore|currently)/i,

  // Type duplication signals
  /already (have|has|defined|exists)/i,
  /similar to existing/i,
  /duplicate of/i,
  /same as the one in/i
];

// Patterns indicating cleanup already done (should NOT trigger)
const CLEANUP_EXCLUSIONS = [
  /removed (the |all )?duplicate/i,
  /consolidated (the |all )?/i,
  /cleaned up/i,
  /deleted (unused|dead|duplicate)/i,
  /migrated (from|to|away)/i,
  /replaced (with|by)/i,
  /removed (backward|legacy|deprecated)/i,
  /standardized on/i,
  /using (only |just )?one (approach|method|way)/i,
  /single source of truth/i
];

// Category-specific patterns for detailed reporting
const CATEGORY_PATTERNS = {
  duplicate_types: [
    /creating (a |new )?(type|interface|enum)/i,
    /defining (a |new )?(type|interface)/i,
    /similar (type|interface)/i,
    /already (have|has|defined|exists)/i,
    /duplicate of/i
  ],
  multiple_approaches: [
    /another way to/i,
    /alternative (approach|method|way)/i,
    /keeping (both|the old)/i,
    /both (methods|approaches|ways)/i,
    /either (way|approach|method)/i
  ],
  backward_compat: [
    /backward compat/i,
    /legacy (support|code|approach)/i,
    /deprecated but kept/i,
    /alias for/i,
    /re-?export/i
  ],
  dead_code: [
    /no longer (used|needed)/i,
    /unused (but|export|function)/i,
    /keeping (for now|just in case)/i,
    /commented out/i,
    /might need later/i
  ]
};

/**
 * Count pattern matches in text
 */
function countPatternMatches(text, patterns) {
  let count = 0;
  const matches = [];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      count++;
      matches.push(match[0].substring(0, 50));
    }
  }

  return { count, matches };
}

/**
 * Detect which categories are triggered
 */
function detectCategories(text) {
  const triggered = [];

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    const { count } = countPatternMatches(text, patterns);
    if (count > 0) {
      triggered.push(category);
    }
  }

  return triggered;
}

async function main() {
  // Get script directory to find config
  const scriptDir = __dirname;
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'cleanup', 'config.json');

  // Default configuration
  let minSessionLength = 5;
  let cleanupThreshold = 2;
  let autoDetect = true;

  // Load config if exists
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      const config = JSON.parse(configContent);
      minSessionLength = config.min_session_length || 5;
      cleanupThreshold = config.cleanup_threshold || 2;
      autoDetect = config.auto_detect !== false;
    } catch {
      // Invalid config, use defaults
    }
  }

  // Skip if auto-detect disabled
  if (!autoDetect) {
    process.exit(0);
  }

  // Get transcript path from environment (set by Claude Code)
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

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
    process.exit(0);
  }

  // Analyze transcript for cleanup triggers
  const triggers = countPatternMatches(transcriptContent, CLEANUP_TRIGGERS);
  const exclusions = countPatternMatches(transcriptContent, CLEANUP_EXCLUSIONS);

  // Calculate cleanup score
  const cleanupScore = triggers.count - exclusions.count;

  // Detect specific categories
  const triggeredCategories = detectCategories(transcriptContent);

  // Log analysis results (only if something found)
  if (triggers.count > 0) {
    log(`[Cleanup] Session analysis: ${triggers.count} debt indicators, ${exclusions.count} cleanup actions`);
  }

  if (cleanupScore >= cleanupThreshold) {
    // Strong recommendation
    log(`[Cleanup] ================================================`);
    log(`[Cleanup] RECOMMENDED: Run /cleanup`);
    log(`[Cleanup] ================================================`);

    if (triggeredCategories.length > 0) {
      log(`[Cleanup] Categories detected: ${triggeredCategories.join(', ')}`);
    }

    if (triggers.matches.length > 0) {
      log(`[Cleanup] Patterns: ${triggers.matches.slice(0, 3).join(', ')}`);
    }

    log(`[Cleanup] This session may have introduced code debt that should be cleaned up.`);
  } else if (triggers.count > 0 && cleanupScore > 0) {
    // Weak suggestion
    log(`[Cleanup] Consider running /cleanup to check for code debt`);
    log(`[Cleanup] Score: ${cleanupScore} (threshold: ${cleanupThreshold})`);
  }
  // If cleanupScore <= 0, stay silent (cleanup was done or no debt found)

  process.exit(0);
}

main().catch(err => {
  console.error('[Cleanup] Error:', err.message);
  process.exit(0);
});
