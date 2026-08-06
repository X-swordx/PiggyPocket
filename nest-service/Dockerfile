# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

# 启动前先跑 migration，失败则不启动服务（避免用旧表结构运行导致难排查的运行时报错）。
# exec 让 node 取代 shell 成为 PID 1，保证能收到 SIGTERM 正常退出。
CMD ["sh", "-c", "npm run migration:run:prod && exec node dist/main.js"]
