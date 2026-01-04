#!/bin/bash

set -e

git pull origin prod

IMAGE_NAME="tethys-portal-docker"
LATEST_TAG="latest"
STANDBY_TAG="standby"

LATEST_IMAGE_ID=$(sudo docker images -q "${IMAGE_NAME}:${LATEST_TAG}")

if [ -n "$LATEST_IMAGE_ID" ]; then
    echo "Found running Image ID: $LATEST_IMAGE_ID"
    sudo docker tag "$LATEST_IMAGE_ID" "${IMAGE_NAME}:${STANDBY_TAG}"
    echo "Renamed existing 'latest' image to '${STANDBY_TAG}'."
else
    echo "No existing 'latest' image found. Skipping rename."
fi

# if command -v npm >/dev/null 2>&1; then
#     echo "npm already installed: $(npm -v)"
# else
#     echo "npm not found, installing..."
#     sudo apt update -y
#     sudo apt install -y nodejs npm
#     echo "Installed Node.js version: $(node -v)"
#     echo "Installed npm version: $(npm -v)"
# fi

echo "Activating conda tethys environment"
# conda activate tethys

cd /home/ubuntu/Tethys_dash_React

eval "$(ssh-agent -s)"
ssh-add /home/ubuntu/.ssh/id_rsa

# Reset local branch and pull latest prod
git fetch origin prod
git reset --hard origin/prod

# echo "Running npm install..."
# npm install
# echo "Running npm build..."
# npm run build

echo "Building new Docker image..."
sudo docker build -t "${IMAGE_NAME}:${LATEST_TAG}" .

echo "Starting new container with 'docker compose up -d'..."
sudo docker compose up -d web

echo "Waiting for the new build to become healthy..."
MAX_WAIT_SECONDS=360
WAIT_INTERVAL_SECONDS=15
ELAPSED_SECONDS=0

while [ "$ELAPSED_SECONDS" -lt "$MAX_WAIT_SECONDS" ]; do
  HEALTH_STATUS=$(sudo docker inspect --format='{{.State.Health.Status}}' tethys_dash_react-web-1 2>/dev/null || true)

  if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo "New build is healthy. Proceeding with cleanup."
    break
  fi

  echo "Container is not yet healthy. Waiting ${WAIT_INTERVAL_SECONDS} seconds..."
  sleep $WAIT_INTERVAL_SECONDS
  ELAPSED_SECONDS=$((ELAPSED_SECONDS + WAIT_INTERVAL_SECONDS))
done


if [ "$HEALTH_STATUS" != "healthy" ]; then
  echo "Error: The new container did not become healthy within the timeout period."
  exit 1
fi

echo "New build is healthy. Removing the standby image."
sudo docker rmi "${IMAGE_NAME}:${STANDBY_TAG}"

# Post Build
echo "Running Post Build"
echo "Running Post Build..."
sudo docker exec tethys_dash_react-web-1 bash -c "
  chown -R www:www /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash &&
  chmod -R 775 /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash
"

sudo docker restart tethys_dash_react-web-1

echo "Deployment completed successfully."
