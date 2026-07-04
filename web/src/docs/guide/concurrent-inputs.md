# Input concurrency

This guide documents the use of the boxty.concurrent decorator to process multiple inputs at the same time in a single Boxty container.

This page is a high-level guide to input concurrency. For reference documentation of the boxty.concurrent decorator, see this page.

## Overview

As traffic to your application increases, Boxty will automatically scale up the number of containers running your Function:

By default, each container will be assigned one input at a time. Autoscaling across containers allows your Function to process inputs in parallel. This is ideal when the operations performed by your Function are CPU-bound.

For some workloads, though, it is inefficient for containers to process inputs one-by-one. Boxty supports these workloads with its input concurrency feature, which allows individual containers to process multiple inputs at the same time:

When used effectively, input concurrency can reduce latency and lower costs.

## Use cases

Input concurrency can be especially effective for workloads that are primarily I/O-bound, e.g.:

- Querying a database
- Making external API requests
- Making remote calls to other Boxty Functions

For such workloads, individual containers may be able to concurrently process large numbers of inputs with minimal additional latency. This means that your Boxty application will be more efficient overall, as it won't need to scale containers up and down as traffic ebbs and flows.

Another use case is to leverage continuous batching on GPU-accelerated containers. Frameworks such as vLLM can achieve the benefits of batching across multiple inputs even when those inputs do not arrive simultaneously (because new batches are formed for each forward pass of the model).

Note that for CPU-bound workloads, input concurrency will likely not be as effective (or will even be counterproductive), and you may want to use Boxty's dynamic batching feature instead.
