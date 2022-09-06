#!/bin/bash
ROOT=$(realpath $(pwd)/..)
BUILD=$(realpath $(pwd)/build)

cd $BUILD

# Create the SSL certs
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" \
    -keyout key.pem -out cert.pem

cd -
