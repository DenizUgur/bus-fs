# Grab the latest alpine image
FROM alpine:latest

# Install python, pip & node, npm
RUN apk add --no-cache --update python3 py3-pip bash \
    nodejs-current npm make gcc

# Copy package files
RUN mkdir -p /opt/webapp/server /opt/webapp/worker
ADD ./webapp/server/package.json /opt/webapp/server
ADD ./webapp/server/package-lock.json /opt/webapp/server
ADD ./webapp/worker/requirements.txt /opt/webapp/worker

# Install dependencies
RUN pip3 install --no-cache-dir -q -r /opt/webapp/worker/requirements.txt
RUN cd /opt/webapp/server && npm ci

# Copy the application
ADD ./webapp /opt/webapp
WORKDIR /opt/webapp

# Run the image as a non-root user
RUN adduser -D node
USER node
ENV NODE_ENV="production"