#!/bin/sh

cd /app
# echo "Deleting 'node_modules' from host machine..."
# rm -rf node_modules
# echo "Deleting 'dist' from host machine..."
# rm -rf dist
pnpm config set store-dir $PNPM_HOME

echo "Installing node_modules..."
rm -rf /app/node_modules
pnpm i

echo "Starting app..."
pnpm run dev
