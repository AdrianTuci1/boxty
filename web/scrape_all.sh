#!/bin/bash
set -e
SLUGS=(
  app client cloudbucketmount cls cron dict environment error filepatternmatcher
  function functioncall image period probe proxy queue retries sandbox sandboxsnapshot
  secret server tunnel volume workspace asgi_app batched billing call_graph concurrent
  config container_process current_function_call_id current_input_id enable_output enter
  exception exit fastapi_endpoint file_io forward interact io_streams is_local method
  parameter web_server wsgi_app
)
OUTDIR=/Users/adriantucicovenco/Proiecte/boxty/web/src/docs/reference
mkdir -p "$OUTDIR"
for slug in "${SLUGS[@]}"; do
  echo "Processing $slug..."
  curl -sL "https://modal.com/docs/sdk/py/latest/modal.${slug}" -o "/tmp/modal_${slug}.html"
  # Extract article innerText-like content via basic text extraction
  grep -oP '(?<=<article)[^>]*>.*?(?=</article>)' "/tmp/modal_${slug}.html" > "/tmp/modal_${slug}_article.html" || true
  if [ ! -s "/tmp/modal_${slug}_article.html" ]; then
    echo "  Could not extract article for $slug"
  fi
done
echo "Done"
