#!/bin/bash

source .env

major=`echo $DK_VERSION | cut -d. -f1`
minor=`echo $DK_VERSION | cut -d. -f2`
revision=`echo $DK_VERSION | cut -d. -f3`

docker login

docker push habidat/auth:$major.$minor.$revision
docker push habidat/auth:$major.$minor
docker push habidat/auth:$major

if [ "$1" == "latest" ] 
then
  docker push habidat/auth
  docker push habidat/auth:stable
fi

echo "FINISHED"