# Developing Boxty code with LLMs

Boxty provides guidelines and best practices for developing Boxty applications using Large Language Models (LLMs).

## Boxty Rules and Guidelines for LLMs

When using LLMs to generate Boxty code, follow these guidelines:

1. Always use `boxty.App()` as the entry point
2. Use `@app.function()` for serverless functions
3. Use `@app.local_entrypoint()` for local scripts
4. Specify resources explicitly (cpu, memory, gpu)
5. Use Volumes for persistent storage
6. Use Secrets for sensitive data
7. Handle errors gracefully with retries and timeouts

Boxty's SDK is designed to be intuitive and Pythonic, making it well-suited for LLM-generated code.
