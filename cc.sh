#!/bin/bash
set -e

./node_modules/.bin/esbuild ./src/main.ts --bundle --platform=node --format=esm --external:typescript --outfile=./bin/ts2go.js
node ./bin/ts2go.js $1 $2
cd $2 && go build -o ./out .