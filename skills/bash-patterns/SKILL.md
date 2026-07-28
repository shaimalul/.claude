---
name: bash-patterns
description: Best practices for writing robust, portable bash scripts including strict mode, quoting, error handling, and CLI tool wrapping.
globs: "**/*.sh,**/*.bash"
user-invocable: false
---

# Bash Scripting Patterns

## Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail
[[ "${TRACE:-0}" == "1" ]] && set -o xtrace

main() {
  # script logic here
  echo "do stuff"
}

main "$@"
```

- Use `#!/usr/bin/env bash` (not `#!/bin/bash`) for portability
- Wrap logic in `main()` called at the end - ensures full script is parsed before execution
- Use `TRACE=1 ./script.sh` for debug output

## Strict Mode

Always start scripts with strict mode:

```bash
set -euo pipefail
```

- `set -e` - Exit on error
- `set -u` - Error on unbound variables (nounset)
- `set -o pipefail` - Pipe fails if any command fails

## set -u Safe Variable Checks

With `set -u`, referencing an unset variable causes an error. Use `${VAR:-}` for safe checks:

```bash
# Bad - crashes with "unbound variable" if VAR is unset
if [ -n "$VAR" ]; then
  echo "$VAR"
fi

# Good - safe with set -u
if [ -n "${VAR:-}" ]; then
  echo "$VAR"
fi

# Good - default value
echo "${VAR:-default_value}"
```

When to apply: Any `[ -n "$VAR" ]`, `[ -z "$VAR" ]`, or `"$VAR"` reference where the variable might not be set, especially in library functions called from scripts with `set -u`.

## Use [[ ]] Over [ ]

Prefer double bracket test syntax:

```bash
# Bad - POSIX single bracket, needs careful quoting
if [ "$name" = "hello world" ]; then

# Good - bash double bracket, safer
if [[ "$name" == "hello world" ]]; then

# Good - regex support
if [[ "$input" =~ ^[0-9]+$ ]]; then
```

When to apply: All conditionals in bash scripts. Only use `[ ]` for POSIX sh compatibility.

## Quoting and Word Splitting

```bash
# Bad - word splitting on spaces
for f in $(ls *.txt); do

# Good - glob directly
for f in *.txt; do

# Bad - unquoted variable
cp $file $dest

# Good - quoted
cp "$file" "$dest"

# Good - array for lists with spaces
files=("file1.txt" "my file.txt" "file3.txt")
for f in "${files[@]}"; do echo "$f"; done

# Good - array for building command args
local args=(-X POST -H "Content-Type: application/json")
curl "${args[@]}" "$url"
```

## Temp File Cleanup

Avoid `trap ... RETURN` for temp file cleanup in library functions - it can cause `unbound variable` errors in the calling scope with `set -u` when the trap string references local variables.

```bash
# Bad - trap RETURN leaks $tmpfile reference to calling scope with set -u
my_function() {
  local tmpfile
  tmpfile=$(mktemp)
  trap 'rm -f "$tmpfile"' RETURN
  # ...
}

# Good - explicit cleanup in each return path
my_function() {
  local tmpfile
  tmpfile=$(mktemp)

  if some_condition; then
    cat "$tmpfile"
    rm -f "$tmpfile"
    return 0
  else
    rm -f "$tmpfile"
    return 1
  fi
}

# Good - trap EXIT for scripts (not library functions)
#!/usr/bin/env bash
WORK_DIR=$(mktemp -d)
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT
```

When to apply: Any function using temp files, especially in sourced library scripts. Use `trap EXIT` only at script level.

## Output Routing: stderr vs stdout

Separate diagnostic output from data output:

```bash
# Logs/errors to stderr, data to stdout
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2; }
die() { log "FATAL: $*"; exit 1; }

# Data goes to stdout (pipeable)
echo "$result"
```

When to apply: Any script that produces data output. Keeps `./script.sh | jq .` clean.

## Capturing stderr While Preserving stdout

The fd swap pattern `2>&1 1>&3` is fragile and can swallow stdout. Use a temp file for stderr instead:

```bash
# Bad - fragile fd redirection, stdout gets lost
stderr_output=$(cmd 2>&1 1>&3) 3>&1

# Good - temp file for stderr, stdout flows normally
local tmpstderr
tmpstderr=$(mktemp)
cmd 2>"$tmpstderr" || exit_code=$?
stderr_content=$(cat "$tmpstderr")
rm -f "$tmpstderr"
```

When to apply: When you need to parse stderr (e.g., extracting HTTP codes from CLI tool error output) while preserving stdout for the caller.

## Parsing CLI Tool Output

When wrapping CLI tools that output metadata on stderr:

```bash
# Example: CLI tool outputs "HTTP 404" on stderr
local tmpstderr
tmpstderr=$(mktemp)
local exit_code=0
curl -s "$api_url" 2>"$tmpstderr" || exit_code=$?

# Parse specific info from stderr
http_code=$(grep -oE 'HTTP ([0-9]+)' "$tmpstderr" | grep -oE '[0-9]+' | tail -1 || true)

# Forward remaining stderr (don't swallow all errors)
grep -v 'HTTP [0-9]' "$tmpstderr" >&2 2>/dev/null || true
rm -f "$tmpstderr"
```

When to apply: Wrapping CLI tools (curl, gh, aws, kubectl) where you need to extract structured info from stderr.

## Input Validation

Validate arguments and environment early:

```bash
main() {
  if [[ $# -lt 2 ]]; then
    echo "Usage: $(basename "$0") <arg1> <arg2>" >&2
    exit 1
  fi

  local required_var="${DEPLOY_ENV:?Error: DEPLOY_ENV must be set}"
}
```

When to apply: All scripts that accept arguments or depend on environment variables.

## Error Guards in Library Functions

Use explicit guards with clear error messages early in functions:

```bash
fetch_resource() {
  local endpoint="${1:?Error: endpoint required}"

  # Guard with default value to avoid set -u crash
  if [[ "$endpoint" == *":id"* ]] && [ -z "${RESOURCE_ID:-}" ]; then
    echo "Error: RESOURCE_ID not set. Call resolve_resource first." >&2
    return 1
  fi
}
```

When to apply: Any library function that depends on global state being initialized.

## Function Conventions

```bash
# Use local variables to avoid polluting global scope
my_function() {
  local temp_var="value"
  local -r constant="immutable"
  echo "$temp_var"
}

# Set global/exported variables for complex returns
resolve_config() {
  APP_DB_HOST="localhost"
  APP_DB_PORT="5432"
}

# echo for single return value
get_count() {
  echo "42"
}
count=$(get_count)
```

## Static Analysis

Run ShellCheck on all bash scripts:

```bash
shellcheck script.sh
```

Catches: unquoted variables, useless cat, incorrect test syntax, and hundreds of other issues. Integrate into CI/CD.

## Self-Documenting Scripts

```bash
# Use long options in scripts for readability
grep --recursive --line-number --extended-regexp "pattern" --include="*.sh" .

# Short flags are fine in interactive use, not in scripts
```
