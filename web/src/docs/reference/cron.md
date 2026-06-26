# boxty.Cron

```python
class Cron(boxty.schedule.Schedule)
```

Cron jobs are a type of schedule, specified using the Unix cron tab syntax.

The alternative schedule type is the boxty.Period.

```python
__init__(self, cron_string, timezone="UTC")
```

Construct a schedule that runs according to a cron expression string.

### Parameters

- **cron_string** `str` — Cron expression (see crontab.guru).
- **timezone** `str` — IANA timezone name; defaults to UTC. (Default is "UTC")

### Usage

```python
import boxty
app = boxty.App()


@app.function(schedule=boxty.Cron("* * * * *"))
def f():
    print("This function will run every minute")
```

We can specify different schedules with cron strings, for example:

```python
boxty.Cron("5 4 * * *")  # run at 4:05am UTC every night
boxty.Cron("0 9 * * 4")  # runs every Thursday at 9am UTC
```

We can also optionally specify a timezone, for example:

```python
boxty.Cron("0 6 * * *", timezone="America/New_York")
```

If no timezone is specified, the default is UTC.
