FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @systemcraft/diagram-schema build
RUN pnpm --filter @systemcraft/shared build
RUN pnpm --filter @systemcraft/api build

EXPOSE 5000
CMD ["pnpm", "--filter", "@systemcraft/api", "start"]
