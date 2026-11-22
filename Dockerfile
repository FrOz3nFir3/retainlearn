# The API server's image. Dokploy builds it on every push to main (Build Type "Dockerfile", Build Path "/"). Only the
# server: the site is built and served by Cloudflare, never here. The build sees the whole repo, but .dockerignore lets
# in only what's copied below, the server and the shared rules, never the client, tests or env files. Dokploy passes
# the server's settings (MONGO_URI and the rest) as environment variables when it starts the container.
#
# Node 26, the newest long-term-support version (supported until April 2029). It runs the shared rules' TypeScript
# files directly. To move to a newer one, change the tag and run the server's tests on it first.
FROM node:26.13.1-trixie-slim

ENV NODE_ENV=production
# No "new npm version available" notice in the logs of commands run in the container.
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# The server lives in /app, where Nixpacks put it, so commands run in the container (`npm run cron:cleanup`,
# `npm run reports`) work as before. The shared rules sit at ../packages/core from it, as in the repo.
WORKDIR /app

# The dependencies first, so a code change doesn't reinstall them, and production ones only. The shared rules bring
# their own (Zod); the server's link to the shared rules (file:../packages/core), so those go first. bcrypt comes with
# ready-made Linux builds, so nothing is compiled.
COPY packages/core/package.json packages/core/package-lock.json /packages/core/
RUN npm ci --omit=dev --prefix /packages/core && npm cache clean --force
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY packages/core/src /packages/core/src
COPY server/src ./src
COPY server/scripts ./scripts

# Not root: the image's own "node" user. The server never writes files.
USER node
EXPOSE 3000

# Node itself rather than npm, so a deploy's stop signal reaches the server, which then closes cleanly (src/server.js).
CMD ["node", "src/server.js"]
