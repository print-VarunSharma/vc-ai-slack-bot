
# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:21.7.1-slim as production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# Create and change to the app directory.
WORKDIR /usr/src/app


# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./
COPY tsconfig.json ./
COPY ./src ./src

RUN pnpm install
RUN pnpm run build

# Environment Variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}


# Install production dependencies.
COPY package.json .
COPY package-lock.json .

RUN npm install 


EXPOSE $PORT
# Run the web service on container startup.

# WORKDIR /usr/src/app/dist

CMD [ "pnpm", "start" ]
