/**
 * Micro-Iteration Validator - State Management
 * Immutable state read/write for micro-iterate sessions
 */

const path = require('path');
const fs = require('fs');
const { getClaudeDir, ensureDir, readFile } = require('./utils');

const STATE_DIR_NAME = path.join('state', 'micro-iterate');

/**
 * Get path to state file for a session
 * @param {string} sessionId
 * @returns {string}
 */
function getStatePath(sessionId) {
  return path.join(getClaudeDir(), STATE_DIR_NAME, `${sessionId}.json`);
}

/**
 * Load state from disk. Returns null if no state exists.
 * @param {string} sessionId
 * @returns {object|null}
 */
function loadState(sessionId) {
  const statePath = getStatePath(sessionId);
  const content = readFile(statePath);
  if (!content) return null;

  try {
    const state = JSON.parse(content);
    if (!state.version || !Array.isArray(state.steps)) return null;
    return state;
  } catch {
    return null;
  }
}

/**
 * Save state to disk atomically (write to temp, then rename).
 * @param {string} sessionId
 * @param {object} state
 */
function saveState(sessionId, state) {
  const statePath = getStatePath(sessionId);
  const tempPath = `${statePath}.tmp`;

  ensureDir(path.dirname(statePath));
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempPath, statePath);
}

/**
 * Delete state file when session completes or aborts.
 * @param {string} sessionId
 */
function deleteState(sessionId) {
  const statePath = getStatePath(sessionId);
  try {
    fs.unlinkSync(statePath);
  } catch {
    // Already gone - that's fine
  }
}

/**
 * Advance to the next step. Returns new state object (immutable).
 * @param {object} state
 * @returns {object}
 */
function advanceStep(state) {
  const updatedSteps = state.steps.map((step, index) => {
    if (index === state.currentStepIndex) {
      return { ...step, status: 'completed' };
    }
    return step;
  });

  return {
    ...state,
    steps: updatedSteps,
    currentStepIndex: state.currentStepIndex + 1,
    currentPhase: 'implement',
    fixAttempts: 0,
  };
}

/**
 * Set the current phase. Returns new state object (immutable).
 * @param {object} state
 * @param {'implement'|'validate'|'fix'} phase
 * @returns {object}
 */
function setPhase(state, phase) {
  return { ...state, currentPhase: phase };
}

/**
 * Increment fix attempt counter. Returns new state object (immutable).
 * @param {object} state
 * @returns {object}
 */
function incrementFixAttempts(state) {
  return { ...state, fixAttempts: state.fixAttempts + 1 };
}

/**
 * Record an iteration timestamp for timing guard checks.
 * @param {object} state
 * @returns {object}
 */
function recordIteration(state) {
  const now = Date.now();
  const times = [...(state.iterationTimes || []), now].slice(-5);
  return {
    ...state,
    iterationTimes: times,
    totalIterations: (state.totalIterations || 0) + 1,
  };
}

/**
 * Check if iterations are too fast (infinite loop guard).
 * Returns true if the last 3 iterations averaged under 15 seconds.
 * @param {object} state
 * @returns {boolean}
 */
function isTooFast(state) {
  const times = state.iterationTimes || [];
  if (times.length < 3) return false;

  const last3 = times.slice(-3);
  const intervals = [];
  for (let i = 1; i < last3.length; i++) {
    intervals.push(last3[i] - last3[i - 1]);
  }

  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return avgMs < 15000;
}

/**
 * Check if all steps are completed.
 * @param {object} state
 * @returns {boolean}
 */
function isComplete(state) {
  return state.currentStepIndex >= state.steps.length;
}

/**
 * Get the current step object (or null if complete).
 * @param {object} state
 * @returns {object|null}
 */
function getCurrentStep(state) {
  return state.steps[state.currentStepIndex] || null;
}

module.exports = {
  getStatePath,
  loadState,
  saveState,
  deleteState,
  advanceStep,
  setPhase,
  incrementFixAttempts,
  recordIteration,
  isTooFast,
  isComplete,
  getCurrentStep,
};
