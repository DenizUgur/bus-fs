# Grab the latest alpine image
FROM ubuntu:20.10

# Install python, pip & node, npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y \
    make gcc g++ git libssl-dev \
    python3 python3-pip nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy the application
ADD ./webapp /opt/webapp

# Install dependencies
RUN cd /opt/webapp/server && npm ci && npm run build
RUN cd /opt/webapp/ui && npm ci && npm run build

# Run the image as a non-root user
RUN adduser node
RUN mkdir -p /opt/encryptor
RUN chown node:node /opt/encryptor
USER node

# Build Excel Encryptor
RUN cd /opt/encryptor && \
    git clone https://github.com/herumi/cybozulib && \
    git clone https://github.com/herumi/msoffice

ENV NODE_ENV="production"
WORKDIR /opt/webapp