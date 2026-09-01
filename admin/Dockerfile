# ================================
# 用 nginx 提供 Vue 3 静态资源
# dist 由本地构建后上传，服务器不再执行 pnpm install 和 vite build
# 构建与上传步骤见 deploy/cloud/README.md
# ================================
FROM nginx:1.27-alpine

COPY apps/core-element-plus/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
