FROM node:22-alpine AS deps

WORKDIR /repo

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/tsconfig.json shared/
COPY system/package.json system/tsconfig.json system/

RUN npm ci -w @briefs/system -w @briefs/shared --include-workspace-root

FROM deps AS build

COPY shared/src shared/src
COPY system/src system/src

RUN npm run build -w @briefs/shared \
  && npm run build -w @briefs/system

FROM node:22-alpine AS prod-deps

WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY system/package.json system/

RUN npm ci -w @briefs/system -w @briefs/shared --include-workspace-root --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /repo

RUN addgroup -g 1001 -S briefs \
  && adduser -S briefs -u 1001 -G briefs

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY --from=build /repo/shared/dist ./shared/dist
COPY shared/package.json ./shared/package.json
COPY --from=build /repo/system/dist ./system/dist
COPY system/package.json ./system/package.json
COPY db db
COPY docker/entrypoint-secrets.sh /usr/local/bin/briefs-entrypoint
RUN chmod 755 /usr/local/bin/briefs-entrypoint

USER briefs

ENV NODE_ENV=production
ENV BRIEFS_HOST=0.0.0.0
ENV BRIEFS_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/briefs-entrypoint"]
CMD ["node", "system/dist/index.js"]
