# Boxty CLI

A Modal-style command-line interface for the Boxty serverless GPU platform.

## Install

```bash
pip install -e cli/
```

Or use the install script:

```bash
curl -fsSL https://cli.boxty.dev/install | sh
```

## Usage

```bash
boxty --help
boxty auth login
boxty workspace list
boxty app list
boxty deploy app.py
boxty run app.py::my_function
boxty serve app.py
```

## Configuration

Config is stored in `~/.boxty/config.json` and loaded with the following precedence:

1. CLI flags (e.g. `--api-url`, `--token`)
2. Environment variables (`BOXTY_API_URL`, `BOXTY_TOKEN`, `BOXTY_WORKSPACE_ID`, `BOXTY_ENVIRONMENT_ID`)
3. Config file (`~/.boxty/config.json`)

## Development

```bash
python -m pytest cli/tests
python -m build cli/
```
