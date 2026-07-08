#!/bin/sh
# Nightly backup — runs inside the `backup` container at 03:00 Tehran.
set -eu
DATE=$(date +%F)
BACKUP_DIR=/backups

echo "[$(date -Iseconds)] starting backup"

pg_dump -Fc -f "$BACKUP_DIR/higooya-$DATE.dump"
tar czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C / uploads

# retain last 30 days
find "$BACKUP_DIR" -maxdepth 1 -name 'higooya-*.dump' -mtime +30 -delete
find "$BACKUP_DIR" -maxdepth 1 -name 'uploads-*.tar.gz' -mtime +30 -delete

# optional off-site copy
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --include 'higooya-*.dump' --include 'uploads-*.tar.gz'
fi

echo "[$(date -Iseconds)] backup complete"
