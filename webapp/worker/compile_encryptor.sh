#!/bin/bash

rm -rf ./tmp && mkdir -p ./tmp
cd ./tmp

git clone --depth 1 https://github.com/DenizUgur/cybozulib
git clone --depth 1 https://github.com/DenizUgur/msoffice

cd ./msoffice
sed -i -e "s/-march=native/-march=x86-64/g" common.mk
make -j`nproc` RELEASE=1

cp ./bin/msoffice-crypt.exe ../../encryptor
chmod +x ../../encryptor

cd ../.. && rm -rf ./tmp
