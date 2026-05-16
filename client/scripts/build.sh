#!/bin/bash
set -e
echo "Building for production..."

for f in js/*.js; do
  name=$(basename "$f")
  npx terser "$f" --compress --mangle --output "js/${name%.js}.min.js"
done

for f in Style/*.css; do
  name=$(basename "$f")
  npx cleancss -o "Style/${name%.css}.min.css" "$f"
done

# Rewrite HTML references to .min versions
for html in index.html view/pages/*.html view/components/*.html; do
  sed -i -E 's|/js/([^"]*)\.js"|/js/\1.min.js"|g' "$html"
  sed -i -E 's|/Style/([^"]*)\.css"|/Style/\1.min.css"|g' "$html"
done

echo "Build complete."
