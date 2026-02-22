#!/usr/bin/env bash
# 安装和部署辅助脚本：Pipeline Manager

# 定义终端输出颜色代码
GREEN='\033[0;32m'    # 绿色（成功信息）
BLUE='\033[0;34m'     # 蓝色（标题/信息）
YELLOW='\033[1;33m'   # 黄色（警告/提示）
RED='\033[0;31m'      # 红色（错误信息）
NC='\033[0m'          # 重置颜色（No Color）

# 打印欢迎横幅
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Huawei Pipeline Manager - Deployment Helper         ║"
echo "║   Status: ✅ Production Ready                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查系统命令是否已安装的辅助函数
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $2 is not installed${NC}"
        # 命令未安装，显示红色错误
        return 1
    fi
    echo -e "${GREEN}✓ $2 found${NC}"
    # 命令已安装，显示绿色成功
    return 0
}

# 检查必要的前置条件
echo -e "\n${BLUE}Checking prerequisites...${NC}"
check_command "node" "Node.js"             # 检查 Node.js
check_command "npm" "npm"                  # 检查 npm
check_command "docker" "Docker" || echo -e "${YELLOW}  (Optional - for containerized deployment)${NC}"
# 检查 Docker（可选，容器化部署时需要）

# 显示部署方式选择菜单
echo -e "\n${BLUE}Choose deployment method:${NC}\n"
echo "1) Local Development (npm)"          # 选项 1：本地开发（npm）
echo "2) Docker Compose"                   # 选项 2：Docker Compose 部署
echo "3) Docker CLI"                       # 选项 3：Docker 命令行部署
echo "4) Show Setup Guide"                 # 选项 4：显示安装指南
echo "5) Exit"                             # 选项 5：退出
echo ""

# 读取用户输入
read -p "Enter choice [1-5]: " choice

# 根据用户选择执行对应操作
case $choice in
    1)
        # 选项 1：本地开发模式
        echo -e "\n${GREEN}Starting local development...${NC}"
        npm install                        # 安装依赖
        echo -e "\n${GREEN}Ready to start! Run:${NC}"
        echo "npm start"                   # 提示启动命令
        echo ""
        echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        echo -e "${YELLOW}Login with the credentials configured in your .env file${NC}"
        ;;
    2)
        # 选项 2：Docker Compose 部署
        echo -e "\n${GREEN}Starting with Docker Compose...${NC}"
        if docker-compose --version > /dev/null 2>&1; then
            docker-compose up -d           # 以后台模式启动所有服务
            echo -e "${GREEN}✓ Application started${NC}"
            echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        else
            echo -e "${RED}Docker Compose not installed${NC}"
            # Docker Compose 未安装
        fi
        ;;
    3)
        # 选项 3：Docker 命令行部署
        echo -e "\n${GREEN}Building Docker image...${NC}"
        if docker --version > /dev/null 2>&1; then
            docker build -t pipeline-manager:latest .   # 构建 Docker 镜像
            echo -e "${GREEN}✓ Image built${NC}"
            echo -e "\n${GREEN}Running container...${NC}"
            docker run -d -p 5000:5000 --name pipeline-manager pipeline-manager:latest
            # 以后台模式运行容器，映射端口 5000
            echo -e "${GREEN}✓ Container running${NC}"
            echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        else
            echo -e "${RED}Docker not installed${NC}"
            # Docker 未安装
        fi
        ;;
    4)
        # 选项 4：显示安装指南
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}QUICK START GUIDE${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        
        echo -e "${YELLOW}1. SETUP ENVIRONMENT${NC}"
        echo "   cp .env.example .env"     # 步骤 1：复制环境变量模板
        echo "   # Edit .env with your settings"
        echo ""
        
        echo -e "${YELLOW}2. INSTALL DEPENDENCIES${NC}"
        echo "   npm install"              # 步骤 2：安装依赖
        echo ""
        
        echo -e "${YELLOW}3. START APPLICATION${NC}"
        echo "   npm start"                # 步骤 3：启动应用
        echo ""
        
        echo -e "${YELLOW}4. ACCESS APPLICATION${NC}"
        echo "   Browser: http://localhost:5000"  # 步骤 4：浏览器访问
        echo "   Login with credentials from your .env file"
        echo ""
        
        echo -e "${YELLOW}5. BEFORE PRODUCTION${NC}"
        echo "   ⚠️  Change default credentials"    # 生产前注意事项：修改默认密码
        echo "   ⚠️  Update JWT_SECRET in .env"     # 更新 JWT 密钥
        echo "   ⚠️  Set NODE_ENV=production"       # 设置为生产环境
        echo "   ⚠️  Configure database"            # 配置数据库
        echo ""
        
        echo -e "${BLUE}For detailed deployment:${NC}"
        echo "   See docs/DEPLOYMENT.md"   # 详细部署文档路径
        echo ""
        ;;
    5)
        # 选项 5：退出
        echo "Goodbye!"
        exit 0
        ;;
    *)
        # 无效输入
        echo -e "${RED}Invalid choice${NC}"
        ;;
esac
