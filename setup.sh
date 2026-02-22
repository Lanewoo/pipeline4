#!/bin/bash
# 部署脚本：Pipeline Manager 初始化设置

set -e
# set -e: 任何命令失败时立即退出脚本

echo "🚀 Pipeline Manager - Deployment Setup"
echo "======================================="

# 检查是否已安装 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    # 未安装 Node.js 时提示并退出
    exit 1
fi

echo "✓ Node.js $(node -v) found"
# 打印 Node.js 版本
echo "✓ npm $(npm -v) found"
# 打印 npm 版本

# 如果 .env 文件不存在，则从模板创建
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    # 复制 .env.example 为 .env
    echo "⚠️  Please update .env with your configuration!"
    # 提示用户修改 .env 中的配置
fi

# 安装项目依赖
echo "📦 Installing dependencies..."
npm install

# 创建数据目录
mkdir -p data

echo ""
echo "✅ Setup complete!"
# 设置完成提示
echo ""
echo "📚 Next steps:"
echo "  1. Update .env with your settings"
# 下一步 1：更新 .env 配置
echo "  2. Run: npm start"
# 下一步 2：运行 npm start
echo "  3. Open http://localhost:5000"
# 下一步 3：打开浏览器访问
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: (set via DEFAULT_ADMIN_PASSWORD in .env)"
echo ""
echo "⚠️  IMPORTANT: Change default credentials in production!"
# 重要提示：生产环境中请修改默认密码！
