#!/bin/bash
set -e

node ./src/main.ts $1 $2
cd $2 && go build -o ./out .