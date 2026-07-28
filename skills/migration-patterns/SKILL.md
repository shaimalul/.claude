---
name: migration-patterns
description: General patterns for migrating systems between technologies including automation, validation, and incremental cutover strategies.
user-invocable: false
---

# Migration Patterns

Reusable patterns for migrating from one technology stack to another (e.g., REST to GraphQL, monolith to microservices).

## Write Code That Writes Code

For large migrations (> ~5 files), build automated transformation pipelines rather than translating manually. For small migrations (< ~5 files), manual translation is acceptable if validation is still automated:

- Parse the source system's format to build a mapping (source concept -> target concept)
- Write migration scripts that generate the target artifacts programmatically
- Preserve original intent (comments, business logic) over syntactic purity
- Dry-run mode as a first-class feature (preview output without writing)

Example dry-run pattern:
```bash
# Preview what would be generated without writing files
./migrate.py --dry-run --source ./rest_schemas/ --target ./graphql_schema/
# Output:
#   [DRY RUN] Would create: graphql_schema/customers.graphql
#   [DRY RUN] Would create: graphql_schema/leads.graphql
#   [DRY RUN] 2 files would be created, 0 skipped
```

Migration scripts are themselves software: decompose into modules (config, parser, transformer, validator, processor), each independently testable.

## Strangler Fig Over Big Bang

Migrate incrementally when possible; old and new systems coexist during transition:

- Read from production (old system), write to new system
- Validate equivalence before cutover
- Keep rollback path available until confidence is established
- Cut over one domain/module at a time, not everything at once

## Automated Results Validation

NEVER rely on manual spot-checks. Automate comparison between old and new systems:

- Run both systems on the same inputs and diff the outputs
- Coverage check: every source artifact has a corresponding target artifact
- Dependency check: references between migrated artifacts are consistent
- Divergence detection: flag where source and target differ, distinguish intentional vs accidental differences
- Build regression tests from production data to catch drift after migration
- Aggregate validation for data pipelines:
  - Row count comparison between old and new system outputs
  - Checksum/hash validation on key columns to detect data corruption
  - Aggregate metric checks (SUM, AVG, MIN, MAX) on numeric fields to catch transformation errors

## Environment Parity

Parameterize environment-specific values (connection strings, schemas, paths):

- Generate environment variants from a single base template, not hand-crafted copies
- Default to safe/staging when parameters are missing
- NEVER hardcode environment names in migrated artifacts

## Migration Commit Strategy

Separate concerns in version control:

- Migration output (generated artifacts) in its own commit(s)
- Migration tooling (scripts) in separate commits
- CI/CD and deployment config in separate commits
- Tag/release only after CI validates
- Keep migration scripts in the repo as documentation of how the migration was done

## Quick Reference

| Principle | Rule |
|-----------|------|
| Automation | Automate for large migrations (> ~5 files); manual OK for small ones |
| Validation | Automate old-vs-new comparison, NEVER rely on spot-checks |
| Incremental | Strangler fig pattern - coexist, validate, cut over |
| Environment | Parameterize everything, generate variants from templates |
| Commits | Separate output, tooling, and CI/CD in version control |
| Preservation | Keep migration scripts as documentation |
