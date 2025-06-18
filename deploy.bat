@echo off
echo 🚀 Deploying Hyper.io Friendship Edition...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git not initialized. Run 'git init' first.
    exit /b 1
)

REM Add and commit any changes
echo 📦 Committing latest changes...
git add .
git commit -m "Deploy: %date% %time%" || echo No changes to commit

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No remote repository configured.
    echo Please add your GitHub repository:
    echo git remote add origin https://github.com/yourusername/hyper-io-game.git
    exit /b 1
)

REM Push to GitHub
echo 🔄 Pushing to GitHub...
git push origin master

echo ✅ Code pushed to GitHub!
echo.
echo 🌐 Next steps:
echo 1. Go to render.com or railway.app
echo 2. Connect your GitHub repository
echo 3. Deploy with these settings:
echo    - Build: cd server ^&^& npm install
echo    - Start: node server/src/server.js
echo.
echo 🎮 Your game will be live in a few minutes!
