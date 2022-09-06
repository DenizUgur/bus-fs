#!/bin/bash
ROOT=$(realpath `pwd`/../..)
BUILD=$(realpath `pwd`/build)

# Copy the config files to the build directory
cp $ROOT/auth.json $BUILD
cp $ROOT/.env $BUILD