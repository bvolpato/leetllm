---
title: Virtual environment
importance: 91
---
A Python **virtual environment** is a project-specific interpreter environment with its own installed packages and executable entry points. By default, it isolates installed third-party packages from the base Python and unrelated projects; `venv --system-site-packages` explicitly allows access to base packages. It shares the base interpreter's standard library and host operating system; code runs with the host process and security privileges. Use containers or operating-system controls when code needs process isolation.

Tools such as Python's built-in `venv` or uv typically create a `.venv` directory. Activating it changes which Python executable and commands the current shell resolves. Alternatively, `uv run` selects the project environment directly without requiring shell activation. Installing a package into that environment doesn't make the package available to every other project.

## Portable inputs versus local output

The environment directory is machine-specific build output. Paths, interpreter binaries, compiled wheels, and operating-system details can make a copied `.venv` unusable elsewhere. Commit the project manifest, Python version constraint, and dependency lockfile instead. Each machine rebuilds its own environment from those portable inputs.


## Example

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install pytest
```

For a uv-managed project, `uv sync --locked` rebuilds the environment from the committed lockfile, and `uv run python --version` checks which interpreter the project selected.

## Why it matters here

A model scorer can fail on another laptop simply because its dependencies were installed globally or only existed inside an untracked environment. Rebuilding `.venv` from explicit project files makes training, evaluation, and tests repeatable across contributors.

## Related terms

- [Dependency lockfile](glossary://dependency-lockfile)
- [Reproducible environment](glossary://reproducible-environment)
- [Packaging](glossary://packaging)
- [PyTorch](glossary://pytorch)
