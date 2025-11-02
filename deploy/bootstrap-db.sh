#!/usr/bin/env zsh
set -euo pipefail

show_help() {
  echo "Usage: $0 -H DB_HOST -U DB_USER -P DB_PASS -u POLARIS_USER -p POLARIS_PASS [-V POLARIS_ADMIN_TOOL_VERSION]"
  echo "       or: $0 --db-host HOST --db-user USER --db-pass PASS --polaris-user USER --polaris-pass PASS [--version VERSION]"
  echo ""
  echo "  -H, --db-host        database host (host[:port] or hostname)"
  echo "  -U, --db-user        database username"
  echo "  -P, --db-pass        database password"
  echo "  -u, --polaris-user   polaris admin username"
  echo "  -p, --polaris-pass   polaris admin password"
  echo "  -V, --version        polaris-admin-tool image version (or set POLARIS_ADMIN_TOOL_VERSION env var)"
  echo "  -h, --help           show this help and exit"
  exit 1
}

DB_HOST=""
DB_USER=""
DB_PASS=""
POLARIS_USER=""
POLARIS_PASS=""
POLARIS_ADMIN_VERSION=""

# Parse short and long options. Supports either '--name value' or '--name=value'
while [ $# -gt 0 ]; do
  case "$1" in
    -H|--db-host)
      shift
      DB_HOST="${1:-}"
      if [ -z "$DB_HOST" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --db-host=*)
      DB_HOST="${1#*=}"
      shift
      ;;
    -U|--db-user)
      shift
      DB_USER="${1:-}"
      if [ -z "$DB_USER" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --db-user=*)
      DB_USER="${1#*=}"
      shift
      ;;
    -P|--db-pass)
      shift
      DB_PASS="${1:-}"
      if [ -z "$DB_PASS" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --db-pass=*)
      DB_PASS="${1#*=}"
      shift
      ;;
    -u|--polaris-user)
      shift
      POLARIS_USER="${1:-}"
      if [ -z "$POLARIS_USER" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --polaris-user=*)
      POLARIS_USER="${1#*=}"
      shift
      ;;
    -p|--polaris-pass)
      shift
      POLARIS_PASS="${1:-}"
      if [ -z "$POLARIS_PASS" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --polaris-pass=*)
      POLARIS_PASS="${1#*=}"
      shift
      ;;
    -V|--version)
      shift
      POLARIS_ADMIN_VERSION="${1:-}"
      if [ -z "$POLARIS_ADMIN_VERSION" ]; then echo "Missing value for $1" >&2; show_help; fi
      shift
      ;;
    --version=*)
      POLARIS_ADMIN_VERSION="${1#*=}"
      shift
      ;;
    -h|--help)
      show_help
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help
      ;;
  esac
done

# ensure required args provided
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$POLARIS_USER" ] || [ -z "$POLARIS_PASS" ]; then
  echo "Error: all options are required." >&2
  show_help
fi

# determine polaris admin tool version: flag/long option > env > default
POLARIS_ADMIN_VERSION="${POLARIS_ADMIN_VERSION:-${POLARIS_ADMIN_TOOL_VERSION:-1.1.0-incubating}}"

# allow optional custom port in DB_HOST; default port 5432 is assumed if not provided in host string
# build JDBC URL (if host already has :port, use as-is)
if [[ "$DB_HOST" == *:* ]]; then
  JDBC_HOST="$DB_HOST"
else
  JDBC_HOST="${DB_HOST}:5432"
fi

# run the admin tool with the requested version
IMAGE_REF="apache/polaris-admin-tool:${POLARIS_ADMIN_VERSION}"

echo "Using polaris-admin-tool image: ${IMAGE_REF}"

podman run \
  -e QUARKUS_DATASOURCE_JDBC_URL="jdbc:postgresql://${JDBC_HOST}/polaris" \
  -e QUARKUS_DATASOURCE_USERNAME="${DB_USER}" \
  -e QUARKUS_DATASOURCE_PASSWORD="${DB_PASS}" \
  -e POLARIS_PERSISTENCE_TYPE=relational-jdbc \
  "${IMAGE_REF}" bootstrap --credential=POLARIS,"${POLARIS_USER}","${POLARIS_PASS}" --realm=POLARIS
