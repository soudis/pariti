#!/bin/bash

source .env

major=`echo $VERSION | cut -d. -f1`
minor=`echo $VERSION | cut -d. -f2`
revision=`echo $VERSION | cut -d. -f3`

docker login

docker push soudis/pariti:$major.$minor.$revision
docker push soudis/pariti:$major.$minor
docker push soudis/pariti:$major

if [ "$1" == "latest" ] 
then
  docker push soudis/pariti
  docker push soudis/pariti:stable
fi

echo "FINISHED"