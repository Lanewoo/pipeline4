#!/usr/bin/env bash
# Installation and Deployment Helper for Pipeline Manager

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Huawei Pipeline Manager - Deployment Helper         ║"
echo "║   Status: ✅ Production Ready                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $2 is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $2 found${NC}"
    return 0
}

echo -e "\n${BLUE}Checking prerequisites...${NC}"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "docker" "Docker" || echo -e "${YELLOW}  (Optional - for containerized deployment)${NC}"

# Menu
echo -e "\n${BLUE}Choose deployment method:${NC}\n"
echo "1) Local Development (npm)"
echo "2) Docker Compose"
echo "3) Docker CLI"
echo "4) Show Setup Guide"
echo "5) Exit"
echo ""

read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Starting local development...${NC}"
        npm install
        echo -e "\n${GREEN}Ready to start! Run:${NC}"
        echo "npm start"
        echo ""
        echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        echo "Username: admin"
        echo "Password: huawei@123"
        ;;
    2)
        echo -e "\n${GREEN}Starting with Docker Compose...${NC}"
        if docker-compose --version > /dev/null 2>&1; then
            docker-compose up -d
            echo -e "${GREEN}✓ Application started${NC}"
            echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        else
            echo -e "${RED}Docker Compose not installed${NC}"
        fi
        ;;
    3)
        echo -e "\n${GREEN}Building Docker image...${NC}"
        if docker --version > /dev/null 2>&1; then
            docker build -t pipeline-manager:latest .
            echo -e "${GREEN}✓ Image built${NC}"
            echo -e "\n${GREEN}Running container...${NC}"
            docker run -d -p 5000:5000 --name pipeline-manager pipeline-manager:latest
            echo -e "${GREEN}✓ Container running${NC}"
            echo -e "${YELLOW}Access at: http://localhost:5000${NC}"
        else
            echo -e "${RED}Docker not installed${NC}"
        fi
        ;;
    4)
        echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}QUICK START GUIDE${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
        
        echo -e "${YELLOW}1. SETUP ENVIRONMENT${NC}"
        echo "   cp .env.example .env"
        echo "   # Edit .env with your settings"
        echo ""
        
        echo -e "${YELLOW}2. INSTALL DEPENDENCIES${NC}"
        echo "   npm install"
        echo ""
        
        echo -e "${YELLOW}3. START APPLICATION${NC}"
        echo "   npm start"
        echo ""
        
        echo -e "${YELLOW}4. ACCESS APPLICATION${NC}"
        echo "   Browser: http://localhost:5000"
        echo "   Username: admin"
        echo "   Password: huawei@123"
        echo ""
        
        echo -e "${YELLOW}5. BEFORE PRODUCTION${NC}"
        echo "   ⚠️  Change default credentials"
        echo "   ⚠️  Update JWT_SECRET in .env"
        echo "   ⚠️  Set NODE_ENV=production"
        echo "   ⚠️  Configure database"
        echo ""
        
        echo -e "${BLUE}For detailed deployment:${NC}"
        echo "   See docs/DEPLOYMENT.md"
        echo ""
        ;;
    5)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        ;;
esac
