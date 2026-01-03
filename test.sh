#!/bin/bash
set -e

./node_modules/.bin/esbuild --log-level=error ./src/**/*.test.ts --bundle --platform=node --format=esm --external:typescript --outdir=./bin/tests
node --test ./bin/tests/**/*.test.js