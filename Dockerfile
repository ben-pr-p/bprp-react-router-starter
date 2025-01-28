# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.2 AS base
WORKDIR /usr/src/app

COPY . .

# Install dependencies
ENV NODE_ENV=production
RUN bun install --production --frozen-lockfile

# Build the app
RUN bun build

# run the app
USER bun
EXPOSE 3000/tcp
EXPOSE 3000/udp
ENV HOST=0.0.0.0
ENTRYPOINT [ "bun", "run", "build/server/index.js" ]