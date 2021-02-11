# Grab the latest alpine image
FROM ubuntu:20.10

# Install python, pip & node, npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_15.x | bash - && \
    apt-get install -y \
    make gcc g++ git libssl-dev \
    python3 python3-pip nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy the application
ADD ./webapp /opt/webapp

# Install dependencies
RUN cd /opt/webapp/server && npm ci && npm run build
RUN mkdir -p /opt/webapp/data/templates

# Build Excel Encryptor
RUN mkdir -p /opt/encryptor && cd /opt/encryptor && \
    git clone https://github.com/herumi/cybozulib && \
    git clone https://github.com/herumi/msoffice

# Compile the app
RUN cd /opt/encryptor/msoffice && \
    sed -i -e "s/-march=native/-march=ivybridge/g" common.mk && \
    make -j RELEASE=1

ENV NODE_ENV="production"
WORKDIR /opt/webapp