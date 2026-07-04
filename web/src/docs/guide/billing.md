# Billing

Boxty is serverless, which means you only pay for the compute you use or request. Reservations are not required, and there are no minimum usage-time increments. Up-to-date unit pricing for all of our products is available on our Pricing page.

## Billing frequency and incremental billing

All workspaces are billed monthly. At the end of each billing cycle, you are auto-charged for the Boxty usage incurred during that cycle (less any credits and incremental usage charges), as well as any subscription fees (non-Starter plans only) for the following billing cycle.

In addition to monthly billing, you will be auto-charged for incremental usage the first time you exceed certain thresholds. These charges occur within the billing cycle.

## Budgets

Boxty supports both workspace-level and environment-level spend budgets. See Budgets for where to configure them and how they interact.

## Updating billing information

To update your billing information, click on "Manage payment details" in the Usage & Billing section of Settings. This will take you to a Stripe-hosted page where you can update your payment method and/or billing email.

Note that you must have a payment method on file in order to use Boxty. If you would like to remove your payment method and delete your workspace, please contact support@boxty.com.

## Viewing invoice history

To view your invoice history and/or download receipts, click on "View invoices" in the Usage & Billing section of Settings. You should see an "Invoice History" section at the bottom of the Stripe-hosted page.

## Generating billing reports

We also offer programmatic APIs for exporting billing reports to workspaces at the Team and Enterprise plan levels. Use the APIs in boxty.billing or the boxty billing CLI to generate tabular reports of spend over time broken down across specific Boxty Apps or other resources.

Note that the granular billing APIs are only available on Team and Enterprise plans.
