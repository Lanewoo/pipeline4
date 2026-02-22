# 使用 Node.js 16 的 Alpine 轻量版作为基础镜像
FROM node:16-alpine

# 设置容器内的工作目录
WORKDIR /app

# 先复制 package 文件（利用 Docker 缓存层，依赖不变时跳过安装）
COPY package*.json ./

# 安装生产环境依赖（不安装 devDependencies）
RUN npm install --production

# 复制所有应用文件到容器
COPY . .

# 声明容器对外暴露的端口
EXPOSE 3000

# 健康检查：每 30 秒检测一次，超时 3 秒，启动等待 5 秒，最多重试 3 次
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动服务器（运行 npm start 命令）
CMD ["npm", "start"]
