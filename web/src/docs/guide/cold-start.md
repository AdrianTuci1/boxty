# Cold start performance

This guide page details the techniques and Boxty features used to improve cold start performance.

## What is a cold start?

Boxty Functions are run in containers.

If a container is already ready to run your Function, it will be reused.

If not, Boxty spins up a new container. This is known as a cold start, and it is often associated with higher latency.

There are two sources of increased latency during cold starts:

- inputs may spend more time waiting in a queue for a container to become ready or "warm".
- when an input is handled by the container that just started, there may be extra work that only needs to be done on the first invocation ("initialization").

If you are invoking Functions with no warm containers or if you otherwise see inputs spending too much time in the "pending" state, you should target queueing time for optimization.

If you see some Function invocations taking much longer than others, and those invocations are the first handled by a new container, you should target initialization for optimization.

## Reduce time spent queueing for warm containers

New containers are booted when there are not enough other warm containers to to handle the current number of inputs.

For example, the first time you send an input to a Function, there are zero warm containers and there is one input, so a single container must be booted up. The total latency for the input will include the time it takes to boot a container.

If you send another input right after the first one finishes, there will be one warm container and one pending input, and no new container will be booted.

Generalizing, there are two factors that affect the time inputs spend queueing: the time it takes for a container to boot and become warm (which we solve by booting faster) and the time until a warm container is available to handle an input (which we solve by having more warm containers).
