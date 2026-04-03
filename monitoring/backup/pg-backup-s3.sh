#!/bin/bash
# =============================================================================
# PostgreSQL Backup to AWS S3
# =============================================================================
# Runs pg_dump, compresses with gzip, uploads to S3, and cleans old local files.
#
# Required env vars:
#   DATABASE_URL        - PostgreSQL connection string
#   S3_BACKUP_BUCKET    - S3 bucket name (e.g. my-app-backups)
#   AWS_ACCESS_KEY_ID   - AWS credentials
#   AWS_SECRET_ACCESS_KEY
#   AWS_DEFAULT_REGION  - AWS region (default: us-east-1)
#
# Optional env vars:
#   S3_BACKUP_PREFIX    - S3 key prefix (default: postgres/)
#   BACKUP_RETENTION_DAYS - Local retention in days (default: 7)
#   APP_NAME            - App identifier in filename (default: app-template)
#
# Usage:
#   chmod +x pg-backup-s3.sh
#   ./pg-backup-s3.sh
#
# Cron (every 6 hours):
#   0 */6 * * * /opt/monitoring/backup/pg-backup-s3.sh >> /var/log/pg-backup.log 2>&1
# =============================================================================

set -euo pipefail

# --- Config ---
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_NAME="${APP_NAME:-ofinanceiro}"
BACKUP_DIR="/tmp/pg-backups"
FILENAME="${APP_NAME}_${TIMESTAMP}.sql.gz"
S3_PREFIX="${S3_BACKUP_PREFIX:-postgres/}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# --- Validate ---
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
  echo "[ERROR] S3_BACKUP_BUCKET is not set" >&2
  exit 1
fi

if ! command -v aws &> /dev/null; then
  echo "[ERROR] AWS CLI is not installed" >&2
  exit 1
fi

# --- Backup ---
mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup: ${FILENAME}"

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --verbose 2>/dev/null \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

FILESIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date -Iseconds)] Dump complete: ${FILESIZE}"

# --- Upload to S3 ---
aws s3 cp \
  "${BACKUP_DIR}/${FILENAME}" \
  "s3://${S3_BACKUP_BUCKET}/${S3_PREFIX}${FILENAME}" \
  --storage-class STANDARD_IA \
  --quiet

echo "[$(date -Iseconds)] Uploaded to s3://${S3_BACKUP_BUCKET}/${S3_PREFIX}${FILENAME}"

# --- Cleanup local files older than RETENTION_DAYS ---
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true

echo "[$(date -Iseconds)] Backup complete"
