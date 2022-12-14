# Grab the latest debian image
FROM debian

# Install python, pip & node, npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y \
    make gcc g++ git libssl-dev \
    python3 python3-pip nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy the application
ADD ./webapp/server/package*.json /opt/webapp/server/

# Install dependencies
RUN cd /opt/webapp/server && \
    npm i -g npm && npm ci
RUN mkdir -p /opt/webapp/server/data/templates

# Build Excel Encryptor
RUN mkdir -p /opt/encryptor && cd /opt/encryptor && \
    git clone https://github.com/DenizUgur/cybozulib && \
    git clone https://github.com/DenizUgur/msoffice

# Compile the app
RUN cd /opt/encryptor/msoffice && \
    sed -i -e "s/-march=native/-march=x86-64/g" common.mk && \
    make -j RELEASE=1

# Copy rest of the application
ADD ./webapp/server/. /opt/webapp/server/

ENV NODE_ENV="production"
WORKDIR /opt/webapp