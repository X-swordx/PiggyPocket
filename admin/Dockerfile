# ================================
# Stage 1: 构建 Vue 3 静态资源
# ================================
FROM node:22-alpine AS builder

# fantastic-admin 强制 pnpm
RUN corepack enable \
 && corepack prepare pnpm@11.13.1 --activate

WORKDIR /app

# 先拷贝 workspace 描述文件，最大化利用层缓存
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.json uno.config.ts eslint.config.js stylelint.config.js ./
COPY scripts ./scripts
COPY packages ./packages
COPY apps ./apps

# 跳过 simple-git-hooks 安装钩子，避免容器内无 .git 时 postinstall 失败
ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=true
ENV CI=true

RUN pnpm install --frozen-lockfile --config.confirmModulesPurge=false

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
