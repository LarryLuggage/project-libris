#!/usr/bin/env bash
set -euo pipefail

venv/bin/python -m pytest
venv/bin/python -m ruff check app tests scripts
venv/bin/python -m mypy app

(
  cd mobile
  npm test -- --watchAll=false
)
