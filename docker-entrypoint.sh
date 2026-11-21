#!/bin/sh
set -e

# ==============================================================================
# Dexta Africa Enterprise Portal - Container Entrypoint
# ==============================================================================
echo "--------------------------------------------------------"
echo "  Dexta Africa Operations Portal - Production Container"
echo "--------------------------------------------------------"

# 1. Parse and prepare SQLite directory if using file: protocol
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    file:*)
      DB_FILE_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
      DB_DIR_PATH=$(dirname "$DB_FILE_PATH")
      if [ -n "$DB_DIR_PATH" ] && [ "$DB_DIR_PATH" != "." ]; then
        echo "📁 [Storage] Ensuring database directory exists: $DB_DIR_PATH"
        mkdir -p "$DB_DIR_PATH" 2>/dev/null || true
      fi
      ;;
  esac
fi

# 2. Database schema synchronization
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "🔄 [Database] Synchronizing database schema and security models..."
  if [ -f "./prisma/ensure-schema.js" ]; then
    node ./prisma/ensure-schema.js || {
      echo "⚠️  [Database] Warning: ensure-schema encountered an issue, proceeding..."
    }
  elif [ -x "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || true
  else
    npx --no-install prisma db push --skip-generate --accept-data-loss 2>/dev/null || true
  fi
fi

# 3. Optional automated seed on initial bootstrap
if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo "🌱 [Database] Running initial database bootstrap seed..."
  if [ -f "./prisma/seed.js" ]; then
    node ./prisma/seed.js || echo "⚠️  [Database] Seed script exited with non-zero status"
  fi
fi

echo "🚀 [Runtime] Starting server process on port ${PORT:-3000} (Host: ${HOSTNAME:-0.0.0.0})..."
exec "$@"

