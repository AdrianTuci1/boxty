# Scheduling remote cron jobs

A common requirement is to perform some task at a given time every day or week automatically. Boxty facilitates this through function schedules.

## Basic scheduling

Let's say we have a Python module heavy.py with a function, perform_heavy_computation().

```python
# heavy.py
def perform_heavy_computation():
    ...

if __name__ == "__main__":
    perform_heavy_computation()
```

To schedule this function to run once per day, we create a Boxty App and attach our function to it with the @app.function decorator and a schedule parameter:

```python
# heavy.py
import boxty

app = boxty.App()

@app.function(schedule=boxty.Period(days=1))
def perform_heavy_computation():
    ...
```

To activate the schedule, deploy your app, either through the CLI:

```bash
boxty deploy --name daily_heavy heavy.py
```

Or programmatically:

```python
if __name__ == "__main__":
   app.deploy()
```

Now the function will run every day, at the time of the initial deployment, without any further interaction on your part.

When you make changes to your function, just rerun the deploy command to overwrite the old deployment.

Note that when you redeploy your function, boxty.Period resets, and the schedule will run X hours after this most recent deployment.

If you want to run your function at a regular schedule not disturbed by deploys, boxty.Cron (see below) is a better option.

## Monitoring your scheduled runs

To see past execution logs for the scheduled function, go to the Apps section on the Boxty web site.

Schedules currently cannot be paused. Instead the schedule should be removed and the app redeployed. Schedules can be started manually on the app's dashboard page, using the "run now" button.

## Schedule types

There are two kinds of base schedule values - boxty.Period and boxty.Cron.

boxty.Period lets you specify an interval between function calls, e.g. Period(days=1) or Period(hours=5):

```python
# runs once every 5 hours
@app.function(schedule=boxty.Period(hours=5))
def perform_heavy_computation():
    ...
```

boxty.Cron lets you specify a cron expression for more complex schedules:

```python
# runs at 9am every Monday
@app.function(schedule=boxty.Cron("0 9 * * 1"))
def perform_heavy_computation():
    ...
```
