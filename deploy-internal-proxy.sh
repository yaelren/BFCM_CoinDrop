#!/bin/bash
# Deployment script for internal BFCM proxy

set -e

echo "🚀 BFCM Internal Proxy Deployment"
echo "=================================="

# Configuration
PORT="${PORT:-8080}"
TARGET_API="${TARGET_API:-https://wix-bo.com/_api/bfcm-dashboard-serverless}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 16+ and try again"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Option selection
echo ""
echo "Select deployment method:"
echo "1) Direct Node.js (simple)"
echo "2) PM2 (recommended for production)"
echo "3) Docker"
echo "4) Docker Compose"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "📦 Starting with Node.js..."
        PORT=$PORT TARGET_API=$TARGET_API node internal-proxy-server.js
        ;;

    2)
        if ! command -v pm2 &> /dev/null; then
            echo "📦 Installing PM2..."
            npm install -g pm2
        fi

        echo "🚀 Starting with PM2..."
        PORT=$PORT TARGET_API=$TARGET_API pm2 start internal-proxy-server.js \
            --name bfcm-proxy \
            --watch false \
            --max-memory-restart 200M

        pm2 save
        echo "✅ Proxy running with PM2"
        echo "📊 View logs: pm2 logs bfcm-proxy"
        echo "⚙️  Manage: pm2 [stop|restart|delete] bfcm-proxy"
        ;;

    3)
        echo "🐳 Building Docker image..."
        docker build -f Dockerfile.proxy -t bfcm-proxy:latest .

        echo "🚀 Running Docker container..."
        docker run -d \
            --name bfcm-proxy \
            --restart unless-stopped \
            -p 8080:8080 \
            -e PORT=8080 \
            -e TARGET_API=$TARGET_API \
            bfcm-proxy:latest

        echo "✅ Proxy running in Docker"
        echo "📊 View logs: docker logs -f bfcm-proxy"
        ;;

    4)
        if ! command -v docker-compose &> /dev/null; then
            echo "❌ docker-compose is not installed"
            exit 1
        fi

        echo "🐳 Starting with Docker Compose..."
        docker-compose -f docker-compose.proxy.yml up -d

        echo "✅ Proxy running with Docker Compose"
        echo "📊 View logs: docker-compose -f docker-compose.proxy.yml logs -f"
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════"
echo "📡 Proxy URL: http://localhost:$PORT"
echo "🏥 Health check: http://localhost:$PORT/health"
echo "═══════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Test: curl http://localhost:$PORT/health"
echo "2. Expose with HTTPS (nginx/cloudflare/etc)"
echo "3. Update Vercel frontend to use proxy URL"
