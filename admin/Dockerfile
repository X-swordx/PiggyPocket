# ================================
# Stage 1: 构建 Vue 3 静态资源
# ================================
FROM node:22-alpine AS builder

# fantastic-admin 强制 pnpm；git 供 simple-git-hooks 的 postinstall 使用
RUN apk add --no-cache git \
 && corepack enable \
 && corepack prepare pnpm@11.13.1 --activate

WORKDIR /app

# 先拷贝 workspace 描述文件，最大化利用层缓存
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.json uno.config.ts eslint.config.js stylelint.config.js ./
COPY scripts ./scripts
COPY packages ./packages
COPY apps ./apps

# 容器里没有 .git，根 package.json 的 postinstall(simple-git-hooks) 会失败；
# 用 --config.confirmModulesPurge=false 保持非交互，并让 simple-git-hooks 失败不阻断。
# 依赖自身的 build script（esbuild 等，见 pnpm-workspace.yaml allowBuilds）必须保留，
# 因此不能用 --ignore-scripts。
RUN git init -q . \
 && pnpm install --frozen-lockfile \
 && rm -rf .git

# 构建 core-element-plus，产物在 apps/core-element-plus/dist
RUN pnpm --filter @fantastic-admin/core-element-plus run build

# ================================
# Stage 2: 用 nginx 提供静态资源
# ================================
FROM nginx:1.27-alpine

COPY --from=builder /app/apps/core-element-plus/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
