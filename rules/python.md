---
paths:
  - "**/*.py"
  - "**/pyproject.toml"
  - "**/Pipfile"
  - "**/setup.py"
  - "**/setup.cfg"
  - "**/.python-version"
---

# Python Development Rules

## Pre-Flight Checklist (BEFORE running ANY Python command)

Before running `python`, `pip`, `pytest`, or any Python script, ALWAYS do these checks in order:

1. Check for existing virtualenv setup:
   - `pyproject.toml` with `[tool.poetry]` -> use `poetry run`
   - `pyproject.toml` with `[tool.uv]` or `uv.lock` -> use `uv run`
   - `.venv/` directory -> activate it first: `source .venv/bin/activate`
   - None of the above -> create a virtualenv before proceeding (see below)

2. Check Python version:
   - Look for `.python-version` file or `pyproject.toml` python requires
   - Run `pyenv versions` to see what's available
   - Use `pyenv local <version>` or `pyenv shell <version>` to select

3. Never use bare `python` or `python3` commands - always go through the virtualenv:

```bash
# BAD - every single one of these
python script.py
python3 script.py
pip install pyyaml
pip3 install pyyaml

# GOOD - poetry project
poetry run python script.py

# GOOD - uv project
uv run python script.py

# GOOD - existing .venv
source .venv/bin/activate && python script.py

# GOOD - new project without tool
pyenv shell 3.12.8  # or whatever version is needed
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python script.py
```

## Virtualenv Discipline (STRICT)

ALWAYS work inside an activated virtualenv. Never run Python commands outside one.

- Poetry projects: use `poetry run` or `poetry shell`
- uv projects: use `uv run`
- New projects without a tool: create virtualenv first, activate it, THEN install
- NEVER suggest `pip install` before a virtualenv exists and is activated
- Avoid `pip install` directly - only acceptable in notebooks or throwaway exploration code
- When writing scripts that need dependencies, include a `requirements.txt` and document the setup

## Python Version Management

- Use `pyenv` to select the correct Python version per project
- Check `.python-version` or `pyproject.toml` for required version
- If no version file exists, check `pyenv versions` and pick the latest stable 3.x

## Python Code Style

- Follow PEP8 coding standards
- Use type hints for all function/method signatures (arguments and return types)
- Never return anonymous tuples - use dataclasses or named tuples
- Use application-specific custom Exception classes instead of generic `raise`
- Use lowercase with underscores for directories and files
- Prefer string enum-like classes over repeated plain string configuration
- Use `UPPER_SNAKE_CASE` for constants not in enum classes
- Check changed files with the project's linter (`ruff check .`, `flake8`, etc.)

## Library Usage

- Don't invent - if a library doesn't have a method, don't ignore the missing method, verify it exists
- Check library docs before assuming an API exists

## Python Code Quality Checklist

Before marking work complete:
- [ ] Running inside virtualenv (poetry run / uv run / activated venv)
- [ ] Correct Python version via pyenv
- [ ] Type hints on all functions
- [ ] No anonymous tuple returns
- [ ] Custom exceptions (not generic raise)
- [ ] Linter passes (ruff/flake8)
- [ ] Tests pass
