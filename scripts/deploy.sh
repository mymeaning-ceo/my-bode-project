#!/bin/bash

# Usage: REMOTE_HOST=user@host REMOTE_DIR=/path/to/project ./scripts/deploy.sh "commit message"

set -euo pipefail

COMMIT_MSG=${1:-"Auto deploy"}
REMOTE_HOST=${REMOTE_HOST:?REMOTE_HOST is required}
REMOTE_DIR=${REMOTE_DIR:?REMOTE_DIR is required}
PM2_APP=${PM2_APP:-my-server}

git add -A
if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MSG"
  git push
else
  echo "No changes to commit."
fi

ssh "$REMOTE_HOST" <<EOS
  set -e
  cd "$REMOTE_DIR"
  git pull
  npm install
  pm2 restart "$PM2_APP"
EOS

