#!/bin/bash
# Deployment script for Pipeline Manager

set -e

echo "🚀 Pipeline Manager - Deployment Setup"
echo "======================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) found"
echo "✓ npm $(npm -v) found"

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
mkdir -p data

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Update .env with your settings"
echo "  2. Run: npm start"
echo "  3. Open http://localhost:5000"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: huawei@123"
echo ""
echo "⚠️  IMPORTANT: Change default credentials in production!"
