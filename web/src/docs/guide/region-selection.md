# Region selection

Boxty lets you select regions for deploying your applications.

## Specifying a container region

Choose a region for your Functions to optimize latency and comply with data residency requirements:

```python
import boxty

app = boxty.App()

@app.function(region="us-east-1")
def us_function():
    ...

@app.function(region="eu-west-1")
def eu_function():
    ...
```

## Pricing

Pricing may vary by region. Check the Boxty pricing page for region-specific rates.

Available regions include:

- us-east-1 (Virginia)
- us-west-2 (Oregon)
- eu-west-1 (Ireland)
- eu-central-1 (Frankfurt)
- ap-southeast-1 (Singapore)
