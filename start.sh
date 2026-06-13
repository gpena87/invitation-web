#!/bin/sh

PORT=${PORT:-3000}
exec npx serve -s dist/api-mongo-app/browser -l $PORT
