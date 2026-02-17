#!/bin/bash
# Run this script to set JWT keys in Convex.
# Or copy the output and paste into Convex Dashboard > Settings > Environment Variables

cd "$(dirname "$0")"
OUTPUT=$(node generateKeys.mjs 2>/dev/null)
JWT_PRIVATE_KEY=$(echo "$OUTPUT" | grep '^JWT_PRIVATE_KEY=' | sed 's/^JWT_PRIVATE_KEY="\(.*\)"$/\1/')
JWKS=$(echo "$OUTPUT" | grep '^JWKS=' | sed 's/^JWKS=\(.*\)$/\1/')

echo "Run these commands (or add via Convex Dashboard):"
echo ""
echo 'npx convex env set JWT_PRIVATE_KEY "'"$JWT_PRIVATE_KEY"'"'
echo ""
echo 'npx convex env set JWKS '"$JWKS"
echo ""
echo "Also set SITE_URL (e.g. http://localhost:5173):"
echo 'npx convex env set SITE_URL "http://localhost:5173"'
