#!/bin/bash

source .env

major=`echo $DK_VERSION | cut -d. -f1`
minor=`echo $DK_VERSION | cut -d. -f2`
revision=`echo $DK_VERSION | cut -d. -f3`

if [ "$1" == "latest" ] 
then
  docker build . --file docker/production/Dockerfile -t habidat/auth -t habidat/auth:$major.$minor.$revision -t habidat/auth:$major.$minor -t habidat/auth:$major -t habidat/auth:stable --pull
else
  docker build . --file docker/production/Dockerfile -t habidat/auth:$major.$minor.$revision -t habidat/auth:$major.$minor -t habidat/auth:$major --pull
fi

echo "FINISHED"