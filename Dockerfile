# The relay has zero dependencies, so there is nothing to install and no build step.
FROM oven/bun:1-alpine

WORKDIR /app
COPY server/ ./server/

ENV PORT=3003
EXPOSE 3003
CMD ["bun", "server/index.ts"]
