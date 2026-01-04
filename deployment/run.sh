#!/bin/bash

tail_file() {
  echo "tailing file $1"
  ALIGN=27
  LENGTH=`echo $1 | wc -c`
  PADDING=`expr ${ALIGN} - ${LENGTH}`
  PREFIX=$1`perl -e "print ' ' x $PADDING;"`
  file="/var/log/$1"
  # each tail runs in the background but prints to stdout
  # sed outputs each line from tail prepended with the filename+padding
  tail -qF $file | sed --unbuffered "s|^|${PREFIX}:|g" &
}

echo_status() {
  local args="${@}"
  tput setaf 4
  tput bold
  echo -e "- $args"
  tput sgr0
}

echo_debug() {
  local args="${@}"
  tput setaf 3
  tput bold
  echo -e "🔍 DEBUG: $args"
  tput sgr0
}

echo_success() {
  local args="${@}"
  tput setaf 2
  tput bold
  echo -e "✅ SUCCESS: $args"
  tput sgr0
}

echo_error() {
  local args="${@}"
  tput setaf 1
  tput bold
  echo -e "❌ ERROR: $args"
  tput sgr0
}

echo_warning() {
  local args="${@}"
  tput setaf 5
  tput bold
  echo -e "⚠️  WARNING: $args"
  tput sgr0
}

echo_info() {
  local args="${@}"
  tput setaf 6
  tput bold
  echo -e "ℹ️  INFO: $args"
  tput sgr0
}

db_max_count=24;
no_daemon=true;
skip_perm=false;
test=false;
db_engine=${TETHYS_DB_ENGINE} # Get the DB engine from environment variable
skip_db_setup=${SKIP_DB_SETUP} # Get the DB setup flag from environment variable
USAGE="USAGE: . run.sh [options]
OPTIONS:
--background              \t run supervisord in background.
--skip-perm               \t skip fixing permissions step.
--db-max-count <INT>      \t number of attempt to connect to the database. Default is at 24.
--test                    \t only run test.
"

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-perm)
      skip_perm=true;
    ;;
    --background)
      no_daemon=false;
    ;;
    --db-max-count)
      shift # shift from key to value
      db_max_count=$1;
    ;;
    --test)
      test=true;
    ;;
    *)
      echo -e "${USAGE}"
      return 0
  esac
  shift
done

echo_status "🚀 Starting up..."
echo_debug "Script started at $(date)"
echo_debug "Current user: $(whoami)"
echo_debug "Current directory: $(pwd)"
echo_debug "Environment variables:"
echo_debug "  TETHYS_DB_ENGINE: ${TETHYS_DB_ENGINE}"
echo_debug "  TETHYS_DB_HOST: ${TETHYS_DB_HOST}"
echo_debug "  TETHYS_DB_PORT: ${TETHYS_DB_PORT}"
echo_debug "  TETHYS_DB_USERNAME: ${TETHYS_DB_USERNAME}"
echo_debug "  SKIP_DB_SETUP: ${SKIP_DB_SETUP}"
echo_debug "  CONDA_HOME: ${CONDA_HOME}"
echo_debug "  CONDA_ENV_NAME: ${CONDA_ENV_NAME}"

echo_debug "📦 Installing dependency fixes"
pip install --upgrade daphne twisted
pip install python-dotenv
echo_success "🥳 Successfully executed."


if [[ $test = false ]]; then
  echo_debug "🔧 Setting up environment variables..."
  # Set extra ENVs
  export NGINX_USER=$(grep 'user .*;' /etc/nginx/nginx.conf | awk '{print $2}' | awk -F';' '{print $1}')
  echo_debug "NGINX_USER set to: ${NGINX_USER}"

  # Apply States
  if [[ $skip_db_setup != true ]]; then
    echo_status "🗄️  Checking if DB is ready"
    echo_debug "Database setup is enabled (skip_db_setup=false)"
    if [[ $db_engine == "django.db.backends.postgresql" ]]; then
        echo_info "🐘 Using PostgreSQL database"
        echo_debug "Creating Salt configuration for PostgreSQL..."
        # Create Salt Config for PostgreSQL
        echo "postgres.host: '${TETHYS_DB_HOST}'" >> /etc/salt/minion
        echo "postgres.port: '${TETHYS_DB_PORT}'" >> /etc/salt/minion
        echo "postgres.user: '${TETHYS_DB_USERNAME}'" >> /etc/salt/minion
        echo "postgres.pass: '${TETHYS_DB_PASSWORD}'" >> /etc/salt/minion
        echo "postgres.bins_dir: '${CONDA_HOME}/envs/${CONDA_ENV_NAME}/bin'" >> /etc/salt/minion
        echo_success "Salt configuration written to /etc/salt/minion"

        db_check_count=0
        echo_debug "Starting database connection check..."
        echo_debug "Max retry attempts: ${db_max_count}"
        echo_debug "Database host: ${TETHYS_DB_HOST}"
        echo_debug "Database port: ${TETHYS_DB_PORT}"
        echo_debug "pg_isready command: ${CONDA_HOME}/envs/${CONDA_ENV_NAME}/bin/pg_isready -h ${TETHYS_DB_HOST} -p ${TETHYS_DB_PORT} -U postgres"

        until ${CONDA_HOME}/envs/${CONDA_ENV_NAME}/bin/pg_isready -h ${TETHYS_DB_HOST} -p ${TETHYS_DB_PORT} -U postgres; do
          if [[ $db_check_count -gt $db_max_count ]]; then
            echo_error "Database was not available in time - exiting after ${db_check_count} attempts"
            exit 1
          fi
          echo_warning "Database is unavailable - attempt ${db_check_count}/${db_max_count} - sleeping 5 seconds..."
          db_check_count=`expr $db_check_count + 1`
          sleep 5
        done
        echo_success "Database connection established after ${db_check_count} attempts!"
      

    else
      echo_info "💾 Using SQLite3 as the database"
      echo_debug "SQLite3 database engine detected"
    fi
  else
    # Database setup should be skipped
    echo_warning "Skipping database setup: SKIP_DB_SETUP environment variable is set to true"
    echo_debug "SKIP_DB_SETUP value: ${SKIP_DB_SETUP}"
  fi
fi

echo_status "🧂 Enforcing start state... (This might take a bit)"
echo_debug "Running Salt state.apply to configure system..."
echo_debug "Salt command: salt-call --local state.apply"
salt-call --local state.apply
echo_success "Salt state.apply completed"

if [[ $test = false ]]; then
  if [[ $skip_perm = false ]]; then
    echo_status "🔐 Fixing permissions"
    echo_debug "Starting permission fixes for nginx user: ${NGINX_USER}"
    echo_debug "Fixing permissions for STATIC_ROOT: ${STATIC_ROOT}"
    find ${STATIC_ROOT} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_debug "Fixing permissions for WORKSPACE_ROOT: ${WORKSPACE_ROOT}"
    find ${WORKSPACE_ROOT} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_debug "Fixing permissions for MEDIA_ROOT: ${MEDIA_ROOT}"
    find ${MEDIA_ROOT} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_debug "Fixing permissions for TETHYS_PERSIST: ${TETHYS_PERSIST}"
    find ${TETHYS_PERSIST} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_debug "Fixing permissions for TETHYSAPP_DIR: ${TETHYSAPP_DIR}"
    find ${TETHYSAPP_DIR} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_debug "Fixing permissions for TETHYS_HOME: ${TETHYS_HOME}"
    find ${TETHYS_HOME} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {}
    echo_success "All permissions fixed successfully"
  fi

  echo_status "👨‍💼 Starting supervisor"
  echo_debug "Starting supervisord process manager..."
  echo_debug "Supervisor command: /usr/bin/supervisord"
  
  # Start Supervisor
  /usr/bin/supervisord
  echo_success "🔥 Supervisor started successfully"

  echo_success "🎉 Done! All services started successfully!"
  echo_info "Application should now be accessible on the configured ports"

  # Watch Logs
  echo_status "📋 Watching logs. You can ignore errors from either apache (httpd) or nginx depending on which one you are using."
  echo_debug "Setting up log monitoring for multiple services..."

  log_files=("httpd/access_log" 
    "httpd/error_log" 
    "nginx/access.log" 
    "nginx/error.log" 
    "supervisor/supervisord.log" 
    "tethys/tethys.log")
  
  echo_debug "Log files to monitor:"
  for log_file in "${log_files[@]}"; do
    echo_debug "  📄 /var/log/${log_file}"
  done

  # When this exits, exit all background tail processes
  trap 'echo_info "🛑 Shutting down log monitoring..."; kill $(jobs -p)' EXIT
  
  echo_debug "Starting log tailing processes..."
  for log_file in "${log_files[@]}"; do
    echo_debug "Starting tail for: ${log_file}"
    tail_file "${log_file}"
  done
  
  echo_success "📊 All log monitoring processes started"
  echo_info "Container is now running and monitoring logs..."
  echo_warning "Press Ctrl+C to stop the container"

  # Read output from tail; wait for kill or stop command (docker waits here)
  wait
fi