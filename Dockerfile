# Grab the latest alpine image
FROM alpine:latest

# Install python, pip & node, npm
RUN apk add --no-cache --update python3 py3-pip bash \
    nodejs-current npm make gcc

# Copy package files
RUN mkdir -p /opt/webapp/server /opt/webapp/worker /opt/webapp/ui
ADD ./webapp/server/package.json /opt/webapp/server
ADD ./webapp/server/package-lock.json /opt/webapp/server

ADD ./webapp/ui/package.json /opt/webapp/ui
ADD ./webapp/ui/package-lock.json /opt/webapp/ui

# Install dependencies
RUN cd /opt/webapp/server && npm ci
RUN cd /opt/webapp/ui && npm ci

# Copy the application
ADD ./webapp /opt/webapp
WORKDIR /opt/webapp

# Run the image as a non-root user
RUN adduser -D node
USER node
ENV NODE_ENV="production"