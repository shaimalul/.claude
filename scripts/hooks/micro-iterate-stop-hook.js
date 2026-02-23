#!/usr/bin/env node
/**
 * Micro-Iteration Validator - Stop Hook
 *
 * Gates micro-step phase transitions using Claude Code's Stop hook blocking.
 * Detects signal tags in Claude's last message and routes to next phase.
 */

const fs = require('fs');
const {
  readStdinJson,
  readFile,
  log,
} = require('../lib/utils');

const {
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
} = require('../lib/micro-iterate-state');

const MAX_FIX_ATTEMPTS = 3;

/** Read the last assistant text from a JSONL transcript file */
function readLastAssistantMessage(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return '';

  const content = readFile(transcriptPath);
  if (!content) return '';

  const lines = content.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.type === 'assistant' && entry.message?.content) {
        const textBlocks = entry.message.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
        if (textBlocks) return textBlocks;
      }
    } catch {
      // Skip malformed lines
    }
  }
  return '';
}

/** Check if a tag is present in text */
function hasTag(text, tag) {
  return text.includes(`<${tag}`);
}

/** Extract attribute value from a tag like <micro-validated result="fail" reason="..."/> */
function extractAttr(text, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = text.match(regex);
  return match ? match[1] : null;
}

/** Read validate template from ~/.claude/templates */
function readTemplate(name) {
  const { getClaudeDir } = require('../lib/utils');
  const path = require('path');
  return readFile(path.join(getClaudeDir(), 'templates', name)) || '';
}

/** Build the block decision output */
function block(reason, systemMessage) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason, systemMessage }));
}

async function main() {
  const hookInput = await readStdinJson();
  const sessionId = hookInput.session_id;
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  if (!sessionId) {
    process.exit(0);
  }

  const state = loadState(sessionId);
  if (!state) {
    // Not a micro-iterate session - allow exit
    process.exit(0);
  }

  // Safety: infinite loop guard
  const updatedState = recordIteration(state);
  if (isTooFast(updatedState)) {
    log('[micro-iterate] Infinite loop detected (iterations < 15s avg). Aborting.');
    deleteState(sessionId);
    process.exit(0);
  }

  // Safety: max total iterations
  const maxIterations = (state.steps.length || 1) * 4;
  if (updatedState.totalIterations > maxIterations) {
    log(`[micro-iterate] Max iterations (${maxIterations}) reached. Aborting.`);
    deleteState(sessionId);
    process.exit(0);
  }

  const lastMessage = readLastAssistantMessage(transcriptPath);

  // Completion: Claude signals all steps done
  if (hasTag(lastMessage, 'micro-complete')) {
    log('[micro-iterate] Feature complete. All steps validated.');
    deleteState(sessionId);
    process.exit(0);
  }

  const { currentPhase, fixAttempts } = state;
  const currentStep = getCurrentStep(state);

  if (!currentStep) {
    // All steps done
    log('[micro-iterate] All steps completed.');
    deleteState(sessionId);
    process.exit(0);
  }

  const stepLabel = `Step ${state.currentStepIndex + 1}/${state.steps.length}: ${currentStep.name}`;

  if (currentPhase === 'implement') {
    if (!hasTag(lastMessage, 'micro-done')) {
      // Claude hasn't signaled done yet - allow exit (Claude genuinely stopped)
      process.exit(0);
    }

    // Transition: implement -> validate
    const nextState = setPhase(updatedState, 'validate');
    saveState(sessionId, nextState);

    const validateTemplate = readTemplate('micro-iterate-validate.md')
      .replace(/\{\{stepIndex\}\}/g, String(state.currentStepIndex + 1))
      .replace(/\{\{totalSteps\}\}/g, String(state.steps.length))
      .replace(/\{\{stepName\}\}/g, currentStep.name)
      .replace(/\{\{stepDescription\}\}/g, currentStep.description || '')
      .replace(/\{\{targetFiles\}\}/g, (currentStep.targetFiles || []).join(', '))
      .replace(/\{\{acceptanceCriteria\}\}/g, (currentStep.acceptanceCriteria || []).join('\n- '))
      .replace(/\{\{stepId\}\}/g, currentStep.id)
      .replace(/\{\{codeType\}\}/g, currentStep.codeType || 'utility');

    block(validateTemplate, `[micro-iterate] ${stepLabel} | Validating`);
    return;
  }

  if (currentPhase === 'validate') {
    const result = extractAttr(lastMessage, 'micro-validated', 'result');

    if (!result) {
      // No signal yet - allow exit
      process.exit(0);
    }

    if (result === 'pass') {
      const advanced = advanceStep(updatedState);
      const isAllDone = isComplete(advanced);

      if (isAllDone) {
        saveState(sessionId, advanced);
        const summary = `All ${state.steps.length} steps validated successfully.\n\nRun \`/quality-gate\` for a final comprehensive check.`;
        block(
          `## Micro-Iteration Complete\n\n${summary}\n\nOutput <micro-complete/> to finish.`,
          `[micro-iterate] COMPLETE | ${state.steps.length}/${state.steps.length} steps passed`
        );
        return;
      }

      saveState(sessionId, advanced);
      const nextStep = advanced.steps[advanced.currentStepIndex];
      const nextStepPrompt = buildImplementPrompt(nextStep, advanced.currentStepIndex, advanced.steps.length);
      block(nextStepPrompt, `[micro-iterate] Step ${advanced.currentStepIndex + 1}/${advanced.steps.length}: Implementing | ${nextStep.name}`);
      return;
    }

    if (result === 'fail') {
      if (fixAttempts >= MAX_FIX_ATTEMPTS) {
        log(`[micro-iterate] Max fix attempts (${MAX_FIX_ATTEMPTS}) reached for step. Skipping.`);
        const advanced = advanceStep(updatedState);
        saveState(sessionId, advanced);

        if (isComplete(advanced)) {
          deleteState(sessionId);
          process.exit(0);
        }

        const nextStep = advanced.steps[advanced.currentStepIndex];
        const nextStepPrompt = buildImplementPrompt(nextStep, advanced.currentStepIndex, advanced.steps.length);
        block(nextStepPrompt, `[micro-iterate] Step ${advanced.currentStepIndex + 1}/${advanced.steps.length}: Implementing (prev skipped) | ${nextStep.name}`);
        return;
      }

      const failReason = extractAttr(lastMessage, 'micro-validated', 'reason') || 'Validation failed';
      const nextState = setPhase(incrementFixAttempts(updatedState), 'fix');
      saveState(sessionId, nextState);

      const fixTemplate = readTemplate('micro-iterate-fix.md')
        .replace(/\{\{stepName\}\}/g, currentStep.name)
        .replace(/\{\{failureReason\}\}/g, failReason)
        .replace(/\{\{fixAttempt\}\}/g, String(fixAttempts + 1))
        .replace(/\{\{maxFixAttempts\}\}/g, String(MAX_FIX_ATTEMPTS));

      block(fixTemplate, `[micro-iterate] ${stepLabel} | Fix attempt ${fixAttempts + 1}/${MAX_FIX_ATTEMPTS}`);
      return;
    }

    process.exit(0);
  }

  if (currentPhase === 'fix') {
    if (!hasTag(lastMessage, 'micro-done')) {
      process.exit(0);
    }

    // Transition: fix -> validate
    const nextState = setPhase(updatedState, 'validate');
    saveState(sessionId, nextState);

    const validateTemplate = readTemplate('micro-iterate-validate.md')
      .replace(/\{\{stepIndex\}\}/g, String(state.currentStepIndex + 1))
      .replace(/\{\{totalSteps\}\}/g, String(state.steps.length))
      .replace(/\{\{stepName\}\}/g, currentStep.name)
      .replace(/\{\{stepDescription\}\}/g, currentStep.description || '')
      .replace(/\{\{targetFiles\}\}/g, (currentStep.targetFiles || []).join(', '))
      .replace(/\{\{acceptanceCriteria\}\}/g, (currentStep.acceptanceCriteria || []).join('\n- '))
      .replace(/\{\{stepId\}\}/g, currentStep.id)
      .replace(/\{\{codeType\}\}/g, currentStep.codeType || 'utility');

    block(validateTemplate, `[micro-iterate] ${stepLabel} | Re-validating after fix`);
    return;
  }

  process.exit(0);
}

/** Build the implement prompt for a step */
function buildImplementPrompt(step, stepIndex, totalSteps) {
  return [
    `## Micro-Step ${stepIndex + 1}/${totalSteps}: ${step.name}`,
    '',
    step.description || '',
    '',
    '### Target Files',
    (step.targetFiles || []).map(f => `- ${f}`).join('\n'),
    '',
    '### Acceptance Criteria',
    (step.acceptanceCriteria || []).map(c => `- ${c}`).join('\n'),
    '',
    '### Rules',
    '- Implement ONLY this step - nothing more',
    '- Follow existing code patterns in the project',
    '- Named exports only, no export default',
    '- When done, output: <micro-done/>',
  ].join('\n');
}

main().catch(err => {
  log(`[micro-iterate] Hook error: ${err.message}`);
  process.exit(0);
});
