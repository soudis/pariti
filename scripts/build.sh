#!/bin/bash

source .env

major=`echo $VERSION | cut -d. -f1`
minor=`echo $VERSION | cut -d. -f2`
revision=`echo $VERSION | cut -d. -f3`

if [ "$1" == "latest" ] 
then
  docker build . --file docker/Dockerfile -t soudis/pariti -t soudis/pariti:$major.$minor.$revision -t soudis/pariti:$major.$minor -t soudis/pariti:$major -t soudis/pariti:stable --pull
else
  docker build . --file docker/Dockerfile -t soudis/pariti:$major.$minor.$revision -t soudis/pariti:$major.$minor -t soudis/pariti:$major --pull
fi

echo "FINISHED"