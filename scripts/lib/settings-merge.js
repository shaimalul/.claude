/**
 * Smart merge for settings.template.json -> settings.json
 *
 * Merges template settings into existing user settings without
 * overriding user customizations. New hooks/permissions are added,
 * existing user values are preserved.
 */

const fs = require('fs');
const { getEntryIdentity, repoScriptPath, templateIdentities } = require('./hook-identity');

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

/** Keep only the hooks `keep(eventType, entry)` accepts, dropping emptied event types */
function filterHooks(result, keep) {
  for (const eventType of Object.keys(result.hooks || {})) {
    result.hooks[eventType] = result.hooks[eventType].filter(entry => keep(eventType, entry));
    if (result.hooks[eventType].length === 0) delete result.hooks[eventType];
  }
}

/**
 * Drop existing hooks sitting under an event type the template no longer
 * uses, when their identity already exists somewhere in the template (under
 * whichever event type replaced it). Without this, a renamed event (e.g.
 * PermissionRequest -> Notification) leaves the old hook firing forever
 * alongside its replacement.
 */
function pruneOrphanedLegacyHooks(result, templateObj, templateIds, homeDir) {
  if (!templateObj.hooks) return;
  filterHooks(result, (eventType, entry) =>
    eventType in templateObj.hooks || !templateIds.has(getEntryIdentity(entry, homeDir))
  );
}

/**
 * Drop user-kept hooks whose repo script was deleted. Such a hook errors on
 * every trigger, and no template change can ever replace it. Hooks the
 * template registers are the template's to keep.
 */
function pruneMissingScriptHooks(result, templateIds, homeDir) {
  filterHooks(result, (eventType, entry) => {
    if (templateIds.has(getEntryIdentity(entry, homeDir))) return true;
    const script = repoScriptPath(entry.hooks?.[0]?.command || '', homeDir);
    return !script || fs.existsSync(script);
  });
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
 * - Hooks whose repo script was deleted are dropped
 * - $schema: always from template
 * - New template keys: added if missing and never offered before (options.offeredKeys)
 */
function mergeSettings(templateObj, existingObj, homeDir, { offeredKeys = [] } = {}) {
  const result = JSON.parse(JSON.stringify(existingObj));

  mergePermissions(result, templateObj);
  mergeHooks(result, templateObj, homeDir);
  const templateIds = templateIdentities(templateObj, homeDir);
  pruneOrphanedLegacyHooks(result, templateObj, templateIds, homeDir);
  pruneMissingScriptHooks(result, templateIds, homeDir);

  // Add top-level template keys the user has never been offered; one they deleted stays deleted
  for (const key of Object.keys(templateObj)) {
    if (key === 'permissions' || key === 'hooks' || key === '$schema') continue;
    if (!(key in result) && !offeredKeys.includes(key)) {
      result[key] = templateObj[key];
    }
  }

  // Always update $schema
  if (templateObj['$schema']) {
    result['$schema'] = templateObj['$schema'];
  }

  return result;
}

module.exports = { mergeSettings };
