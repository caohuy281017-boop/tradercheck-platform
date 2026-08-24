FROM node:22.18.0-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @tradecheck/gateway... build && \
    pnpm prune --prod

USER node
EXPOSE 8080
CMD ["node", "services/gateway/dist/server.js"]
