FROM node:24-bookworm-slim AS build

WORKDIR /site
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN python3 tools/site/build_seo.py \
  && npm run build:simulation

FROM node:24-bookworm-slim AS runtime
WORKDIR /site
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
COPY --from=build /site /site
EXPOSE 8080
CMD ["node", "tools/static-server.mjs"]
