#!/usr/bin/env bash
# Ensure PostgreSQL is running and the `pos` database exists for the session.
set -e
if command -v pg_ctlcluster >/dev/null 2>&1; then
  pg_isready -q 2>/dev/null || pg_ctlcluster 16 main start 2>/dev/null || service postgresql start 2>/dev/null || true
fi
# wait briefly for readiness
for i in 1 2 3 4 5; do pg_isready -q 2>/dev/null && break; sleep 1; done
if pg_isready -q 2>/dev/null; then
  su postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='pos'\"" 2>/dev/null | grep -q 1 \
    || su postgres -c "psql -c \"CREATE USER pos WITH PASSWORD 'pos';\"" 2>/dev/null || true
  su postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='pos'\"" 2>/dev/null | grep -q 1 \
    || su postgres -c "psql -c \"CREATE DATABASE pos OWNER pos;\"" 2>/dev/null || true
fi
echo "PostgreSQL ready for Berkah Jaya POS."
