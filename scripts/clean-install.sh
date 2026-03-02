#!/bin/bash
rm -rf node_modules package-lock.json
npm install
npm dedupe
echo "Dependencies cleaned and deduplicated"
