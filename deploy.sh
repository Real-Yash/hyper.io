#!/bin/bash

echo "🚀 Deploying Hyper.io Friendship Edition..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run 'git init' first."
    exit 1
fi

# Add and commit any changes
echo "📦 Committing latest changes..."
git add .
git commit -m "Deploy: $(date)" || echo "No changes to commit"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote repository configured."
    echo "Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/hyper-io-game.git"
    exit 1
fi

# Push to GitHub
echo "🔄 Pushing to GitHub..."
git push origin master

echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps:"
echo "1. Go to render.com or railway.app"
echo "2. Connect your GitHub repository"
echo "3. Deploy with these settings:"
echo "   - Build: cd server && npm install"
echo "   - Start: node server/src/server.js"
echo ""
echo "🎮 Your game will be live in a few minutes!"
