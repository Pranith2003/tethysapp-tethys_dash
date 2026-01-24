#!/usr/bin/env bash
set -euo pipefail

#######################################
# Fancy status printer
#######################################
echo_status() {
  local msg="$*"
  tput setaf 4
  tput bold
  echo -e "➤ $msg"
  tput sgr0
}

echo_skip() {
  local msg="$*"
  tput setaf 3
  echo -e "↪ SKIP: $msg"
  tput sgr0
}

echo_ok() {
  local msg="$*"
  tput setaf 2
  echo -e "✔ $msg"
  tput sgr0
}

DB_EXISTS () {
  psql -h tethys_db -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$1'" | grep -q 1
}

USER_EXISTS () {
  psql -h tethys_db -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$1'" | grep -q 1
}

#######################################
# Environment
#######################################
export PGPASSWORD=${TETHYS_DB_PASSWORD}
cd "$TETHYS_HOME"

#######################################
# 1. Database setup
#######################################
echo_status "Creating database for Tethys (if required)"

if ! USER_EXISTS "tethys_super"; then
  echo_ok "Creating user tethys_super"
  tethys db create --superuser
else
  echo_skip "User tethys_super already exists"
fi

if ! DB_EXISTS "tethys_super"; then
  echo_ok "Creating database tethys_super"
  tethys db create
else
  echo_skip "Database tethys_super already exists — skipping"
fi

# ---- tethys_platform ----
if ! USER_EXISTS "tethys_default"; then
  echo_ok "Creating user tethys_default"
  tethys db create --default
else
  echo_skip "User tethys_default already exists — skipping"
fi

if ! DB_EXISTS "tethys_platform"; then
  echo_ok "Creating database tethys_platform"
  tethys db create
else
  echo_skip "Database tethys_platform already exists — skipping"
fi

#######################################
# 2. Django migrations
#######################################
echo_status "Running Django migrations"

if tethys db migrate >/dev/null 2>&1; then
  echo_ok "Migrations applied"
else
  echo_skip "No migrations to apply"
fi

#######################################
# 3. Alembic migrations (optional)
#######################################

echo_status "Running Alembic migrations (if present)"

ALEMBIC_DIR="$TETHYS_HOME/apps/tethys_react_app/tethysapp/tethysdash"

if [ -d "$ALEMBIC_DIR" ]; then
  cd "$ALEMBIC_DIR"

  if ! command -v alembic >/dev/null 2>&1; then
    echo_status "Installing Alembic"
    pip install alembic
  else
    echo_skip "Alembic already installed"
  fi

  if alembic current >/dev/null 2>&1; then
    echo_skip "Alembic already at latest revision"
  else
    alembic upgrade head
    echo_ok "Alembic migrations applied"
  fi
else
  echo_skip "Alembic directory not found"
fi


#######################################
# 4. Install Tethys app
#######################################
echo_status "Installing tethysdash (if required)"

cd "$TETHYS_HOME/apps/tethys_react_app/"

if tethys list | awk '/^Apps:/{flag=1;next} /^[^ ]/{flag=0} flag' | grep -q '^  tethysdash$'; then
  echo_skip "tethysdash already installed"
else
  tethys install
  echo_ok "tethysdash installed"
fi


#######################################
# 5. Persistent service
#######################################
echo_status "Creating persistent database service"

if ! tethys services list | grep -q primary_db; then
  tethys services create persistent \
    -n primary_db \
    -c postgres:postgres@tethys_db:5432
  echo_ok "Persistent service created"
else
  echo_skip "Persistent service already exists"
fi

#######################################
# 6. Persistent link
#######################################
echo_status "Linking persistent store"

if ! tethys link list | grep -q "tethysdash:ps_database:primary_db"; then
  tethys link persistent:primary_db tethysdash:ps_database:primary_db
  echo_ok "Persistent store linked"
else
  echo_skip "Persistent store already linked"
fi

#######################################
# 7. Intake plugins
#######################################
echo_status "Installing Intake plugins (editable)"

if pip show intake >/dev/null 2>&1; then
  echo_skip "Intake already installed"
else
  pip install -e .
  echo_ok "Intake plugins installed"
fi

#######################################
# 8. Static files
#######################################
echo_status "Collecting static files"
cd "$TETHYS_HOME/apps/tethys_react_app/"
tethys manage collectstatic --noinput
echo_ok "Static files collected"

#######################################
# Done
#######################################
echo_ok "Tethys initialization complete"
