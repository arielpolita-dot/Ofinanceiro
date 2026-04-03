#!/bin/bash
set -e

# Create the audit database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE ofinanceiro_audit;
    GRANT ALL PRIVILEGES ON DATABASE ofinanceiro_audit TO postgres;
EOSQL

echo "Databases created successfully"
