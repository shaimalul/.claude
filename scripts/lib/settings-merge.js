/**
 * Smart merge for settings.template.json -> settings.json
 *
 * Merges template settings into existing user settings without
 * overriding user customizations. New hooks/permissions are added,
 * existing user values are preserved.
 */

// Legacy notification hooks -> the play-sound.sh invocation that replaced them.
// Without this a settings.json written before the sounds were bundled keeps its
// old hook AND gains the new one, so every event fires twice.
const WRAPPER_MAP = {
  'scripts/hooks/notify-wrapper.sh': 'scripts/hooks/play-sound.sh notify',
  'plugins/claude-notifier-plugin/scripts/notify.sh': 'scripts/hooks/play-sound.sh notify',
  'scripts/hooks/play-sound.sh': 'scripts/hooks/play-sound.sh done',
  'afplay /System/Library/Sounds/Submarine.aiff': 'scripts/hooks/play-sound.sh done'
};

/**
 * Extract canonical identity from a hook command string.
 * Strips runner prefix and home dir prefix.
 */
function getHookIdentity(command, homeDir) {
  let cleaned = command.replace(/^(?:node|bash|sh|python3?)\s+/, '');

  const prefixes = [
    '__HOME__/.claude/',
    `${homeDir}/.claude/`,
    '~/.claude/'
  ];
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }

  return WRAPPER_MAP[cleaned] || cleaned;
}

/**
 * Get identity for a hook entry (uses first hook's command).
 */
function getEntryIdentity(hookEntry, homeDir) {
  if (!hookEntry.hooks || hookEntry.hooks.length === 0) return null;
  const command = hookEntry.hooks[0].command;
  if (!command) return null;
  return getHookIdentity(command, homeDir);
}

/**
 * Merge permissions.allow (union) and preserve user's defaultMode.
 */
function mergePermissions(result, templateObj) {
  if (!templateObj.permissions) return;
  if (!result.permissions) {
    result.permissions = JSON.parse(JSON.stringify(templateObj.permissions));
    return;
  }

  // Union allow arrays
  if (templateObj.permissions.allow) {
    const existing = new Set(result.permissions.allow || []);
    for (const entry of templateObj.permissions.allow) {
      existing.add(entry);
    }
    result.permissions.allow = [...existing];
  }

  // defaultMode: user wins if present
  if (!result.permissions.defaultMode && templateObj.permissions.defaultMode) {
    result.permissions.defaultMode = templateObj.permissions.defaultMode;
  }
}

/**
 * Merge hooks by event type. Identifies hooks by script path.
 * Adds new template hooks, preserves user's existing hooks.
 */
function mergeHooks(result, templateObj, homeDir) {
  if (!templateObj.hooks) return;
  if (!result.hooks) {
    result.hooks = JSON.parse(JSON.stringify(templateObj.hooks));
    return;
  }

  for (const eventType of Object.keys(templateObj.hooks)) {
    const templateEntries = templateObj.hooks[eventType];

    if (!result.hooks[eventType]) {
      result.hooks[eventType] = JSON.parse(JSON.stringify(templateEntries));
      continue;
    }

    const existingEntries = result.hooks[eventType];

    // Build identity set of existing hooks
    const existingIds = new Set();
    for (const entry of existingEntries) {
      const id = getEntryIdentity(entry, homeDir);
      if (id) existingIds.add(id);
    }

    // Add template hooks not already present
    for (const templateEntry of templateEntries) {
      const templateId = getEntryIdentity(templateEntry, homeDir);
      if (templateId && existingIds.has(templateId)) continue;
      if (!templateId) continue; // skip unidentifiable hooks
      existingEntries.push(JSON.parse(JSON.stringify(templateEntry)));
    }
  }
}

/**
 * Drop existing hooks sitting under an event type the template no longer
 * uses, when their identity already exists somewhere in the template (under
 * whichever event type replaced it). Without this, a renamed event (e.g.
 * PermissionRequest -> Notification) leaves the old hook firing forever
 * alongside its replacement.
 */
function pruneOrphanedLegacyHooks(result, templateObj, homeDir) {
  if (!templateObj.hooks || !result.hooks) return;

  const templateIds = new Set();
  for (const entries of Object.values(templateObj.hooks)) {
    for (const entry of entries) {
      const id = getEntryIdentity(entry, homeDir);
      if (id) templateIds.add(id);
    }
  }

  for (const eventType of Object.keys(result.hooks)) {
    if (eventType in templateObj.hooks) continue; // handled by mergeHooks

    result.hooks[eventType] = result.hooks[eventType].filter(entry => {
      const id = getEntryIdentity(entry, homeDir);
      return !(id && templateIds.has(id));
    });

    if (result.hooks[eventType].length === 0) delete result.hooks[eventType];
  }
}

/**
 * Smart-merge template settings into existing user settings.
 *
 * Rules:
 * - User-only top-level keys preserved (feedbackSurveyState, etc.)
 * - permissions.allow: union
 * - permissions.defaultMode: user wins
 * - hooks: add new by script identity, keep user versions
 * - Orphaned hooks under a renamed/removed event type are dropped once the
 *   template's replacement is present
 * - $schema: always from template
 * - New template keys: added if missing
 */
function mergeSettings(templateObj, existingObj, homeDir) {
  const result = JSON.parse(JSON.stringify(existingObj));

  mergePermissions(result, templateObj);
  mergeHooks(result, templateObj, homeDir);
  pruneOrphanedLegacyHooks(result, templateObj, homeDir);

  // Add new top-level keys from template (don't override existing)
  for (const key of Object.keys(templateObj)) {
    if (key === 'permissions' || key === 'hooks' || key === '$schema') continue;
    if (!(key in result)) {
      result[key] = templateObj[key];
    }
  }

  // Always update $schema
  if (templateObj['$schema']) {
    result['$schema'] = templateObj['$schema'];
  }

  return result;
}

module.exports = { mergeSettings, getHookIdentity, getEntryIdentity };
