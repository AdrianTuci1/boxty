# boxty.Period

```python
class Period(boxty.schedule.Schedule)
```

Create a schedule that runs every given time interval.

Only seconds can be a float. All other arguments are integers.

Note that `days=1` will trigger the function the same time every day. This does not have the same behavior as `seconds=84000` since days have different lengths due to daylight savings and leap seconds. Similarly, using `months=1` will trigger the function on the same day each month.

This behaves similar to the dateutil package.

## Usage

```python
import boxty
app = boxty.App()

@app.function(schedule=boxty.Period(days=1))
def f():
    print("This function will run every day")

boxty.Period(hours=4)          # runs every 4 hours
boxty.Period(minutes=15)       # runs every 15 minutes
boxty.Period(seconds=math.pi)  # runs every 3.141592653589793 seconds
```

## __init__

```python
__init__(self, *, years=0, months=0, weeks=0, days=0, hours=0, minutes=0,
    seconds=0)
```