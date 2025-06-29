#!/bin/bash

echo "🔧 Deploying Supabase auth fix..."

# Pull latest changes
git pull origin main

# Navigate to frontend directory
cd async-code-web

# Install dependencies (in case any changed)
npm install

# Build the application
echo "📦 Building frontend..."
npm run build

# Restart the frontend service
echo "🔄 Restarting frontend service..."
pm2 restart async-code-frontend

# Show status
pm2 status

echo "✅ Deploy complete! Check the logs for any errors:"
echo "   pm2 logs async-code-frontend"