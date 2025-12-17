#!/bin/bash
set -e

./node_modules/.bin/esbuild ./src/**/*.test.ts --bundle --platform=node --format=esm --external:typescript --outdir=./bin/tests
node --test ./bin/tests/**/*.test.js