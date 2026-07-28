/**
 * Builders for Claude Code hook stdin payloads.
 *
 * Single source of truth for the documented hook input contract, so a docs
 * revision is a one-file change rather than a sweep across every test.
 * Contract: https://code.claude.com/docs/en/hooks
 *
 * Common fields are present on every event. `session_id` and `transcript_path`
 * arrive here on stdin - they are NOT environment variables.
 */

const DEFAULT_SESSION_ID = '00000000-0000-4000-8000-000000000000';

/** Fields every hook event receives */
function commonFields(overrides = {}) {
  return {
    session_id: DEFAULT_SESSION_ID,
    transcript_path: '',
    cwd: process.cwd(),
    permission_mode: 'default',
    ...overrides,
  };
}

/** PreToolUse payload - carries the tool about to run */
function preToolUse(toolName, toolInput, overrides = {}) {
  return {
    ...commonFields(overrides),
    hook_event_name: 'PreToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: 'toolu_test000000000000000',
  };
}

/** PostToolUse payload - carries the tool result alongside its input */
function postToolUse(toolName, toolInput, toolResponse, overrides = {}) {
  return {
    ...preToolUse(toolName, toolInput, overrides),
    hook_event_name: 'PostToolUse',
    tool_response: toolResponse,
  };
}

/**
 * Stop payload. `last_assistant_message` is the documented way to read the
 * final assistant text - the docs direct hooks here instead of parsing the
 * transcript, whose format is internal and unstable.
 */
function stop(lastAssistantMessage = '', overrides = {}) {
  return {
    ...commonFields(overrides),
    hook_event_name: 'Stop',
    last_assistant_message: lastAssistantMessage,
  };
}

/** SessionStart payload - `source` explains why the session began */
function sessionStart(source = 'startup', overrides = {}) {
  return {
    ...commonFields(overrides),
    hook_event_name: 'SessionStart',
    source,
    model: 'claude-sonnet-5',
  };
}

/** SessionEnd payload */
function sessionEnd(overrides = {}) {
  return { ...commonFields(overrides), hook_event_name: 'SessionEnd' };
}

module.exports = {
  DEFAULT_SESSION_ID,
  commonFields,
  preToolUse,
  postToolUse,
  stop,
  sessionStart,
  sessionEnd,
};
