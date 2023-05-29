#!/bin/bash
# Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
# Use of this source code is governed by the GPL-3.0
# license that can be found in the LICENSE file.

MAIN_IMAGE_NAME="gpt-monitor"
MAIN_CONTAINER_NAME="gpt-monitor"
CRON_IMAGE_NAME="gpt-monitor-cron"
CRON_CONTAINER_NAME="gpt-monitor-cron"

HOSTNAME="gpt-monitor.adamkdean.co.uk"

# First, build the images
docker build -t $MAIN_IMAGE_NAME -f Dockerfile .
docker build -t $CRON_IMAGE_NAME -f Dockerfile.cron .

# Next, stop and remove the old image
docker rm -f $MAIN_CONTAINER_NAME
docker rm -f $CRON_CONTAINER_NAME

# Finally, run the new images
docker run \
  --detach \
  --restart always \
  --name $CRON_CONTAINER_NAME \
  --network core-network \
  --env FLEXDB_API_KEY=$FLEXDB_API_KEY \
  --env OUTPUT_PATH=/images \
  --volume gpt-monitor-data:/images \
  $CRON_IMAGE_NAME

docker run \
  --detach \
  --restart always \
  --name $MAIN_CONTAINER_NAME \
  --network core-network \
  --expose 8000 \
  --env HTTP_PORT=8000 \
  --env OPENAI_API_KEY=$OPENAI_API_KEY \
  --env FLEXDB_API_KEY=$FLEXDB_API_KEY \
  --env MONITOR_PATTERN="$MONITOR_PATTERN" \
  --env VIRTUAL_HOST=$HOSTNAME \
  --env LETSENCRYPT_HOST=$HOSTNAME \
  --volume gpt-monitor-data:/www/src/public/images \
  $MAIN_IMAGE_NAME
