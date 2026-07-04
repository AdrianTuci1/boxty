# Boxty CLI

Modal-style CLI for the Boxty serverless GPU platform.

## Install

```bash
pip install -e cli/
```

## Usage

```bash
boxty auth login <external_user_id>
boxty workspace create my-workspace --switch
boxty environment create prod

# Deploy an app
boxty app deploy app.py

# Run a function
boxty run app.py::hello

# List workloads
boxty app list

# Volumes
boxty volume create my-data --size 20
boxty volume ls my-volume-id
boxty volume put my-volume-id ./data.txt /data.txt
```
