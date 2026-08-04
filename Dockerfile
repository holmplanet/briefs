FROM node:22-alpine AS deps

WORKDIR /repo

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY system/package.json system/
COPY client/personal/package.json client/personal/
COPY client/livestock/package.json client/livestock/
COPY client/fishing/package.json client/fishing/
RUN npm ci

FROM node:22-alpine AS runtime

WORKDIR /repo

RUN addgroup -g 1001 -S briefs \
  && adduser -S briefs -u 1001 -G briefs

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared shared
COPY system system
COPY client client
COPY db db

USER briefs

ENV NODE_ENV=production
ENV BRIEFS_HOST=0.0.0.0
ENV BRIEFS_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "system/src/index.ts"]
