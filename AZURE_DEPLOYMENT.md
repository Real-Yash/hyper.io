# Azure Web App Deployment Guide for Hyper.io

## 🚀 Azure Web App Optimization

Your Hyper.io game is now optimized for Azure Web App deployment with:

### ✅ **Azure-Specific Configurations:**

1. **web.config** - IIS configuration for Node.js
2. **WebSocket Support** - Enabled for Socket.IO real-time communication
3. **Proper Routing** - Static files and Socket.IO handling
4. **Security Headers** - Production-ready security
5. **Caching** - Optimized static content delivery

### 🎯 **Deploy to Azure Web App:**

#### Option 1: Azure Portal (Recommended)
1. **Create Web App**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create Resource → Web App
   - Runtime: Node.js 18+ 
   - OS: Windows or Linux

2. **Configure Deployment**:
   - Deployment Center → GitHub
   - Select your repository: `Real-Yash/hyper.io`
   - Branch: `main`
   - Build provider: GitHub Actions

3. **Application Settings**:
   ```
   NODE_ENV = production
   WEBSITE_NODE_DEFAULT_VERSION = 18.16.0
   SCM_DO_BUILD_DURING_DEPLOYMENT = true
   ```

#### Option 2: Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name hyper-io-rg --location "East US"

# Create App Service plan
az appservice plan create --name hyper-io-plan --resource-group hyper-io-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group hyper-io-rg --plan hyper-io-plan --name hyper-io-game --runtime "NODE|18-lts"

# Configure deployment from GitHub
az webapp deployment source config --name hyper-io-game --resource-group hyper-io-rg --repo-url https://github.com/Real-Yash/hyper.io --branch main --manual-integration

# Enable WebSocket
az webapp config set --name hyper-io-game --resource-group hyper-io-rg --web-sockets-enabled true
```

### 🔧 **Azure-Specific Features:**

#### **WebSocket Support**
- ✅ Enabled in web.config
- ✅ Socket.IO will work perfectly
- ✅ Real-time multiplayer supported

#### **Auto-Scaling**
- Set up auto-scaling rules based on CPU/memory
- Handle traffic spikes automatically

#### **Custom Domain**
- Add your own domain (e.g., hyper-io.your-domain.com)
- Free SSL certificate included

#### **Monitoring**
- Application Insights for performance monitoring
- Real-time logs and metrics
- Error tracking and diagnostics

### 💰 **Azure Pricing Tiers:**

1. **Free Tier** (F1):
   - 60 minutes/day runtime
   - Good for testing
   - ❌ No custom domains
   - ❌ Limited WebSocket support

2. **Basic Tier** (B1) - **Recommended**:
   - $13/month
   - ✅ Always-on applications
   - ✅ Full WebSocket support
   - ✅ Custom domains
   - ✅ SSL certificates

3. **Standard Tier** (S1):
   - $56/month
   - ✅ Auto-scaling
   - ✅ Staging slots
   - ✅ Daily backups

### 🌐 **Platform Comparison:**

| Feature | Render.com | Azure Web App | Vercel |
|---------|------------|---------------|--------|
| **Free Tier** | 750 hrs/month | 60 min/day | Functions only |
| **WebSocket** | ✅ Full support | ✅ Full support | ❌ Limited |
| **Auto-scaling** | ❌ | ✅ | ✅ |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **Database** | Add-ons | ✅ Integrated | ✅ Vercel KV |
| **Monitoring** | Basic | ✅ Advanced | ✅ Analytics |

### 🎮 **Why Azure for Multiplayer Games:**

1. **Global CDN** - Fast loading worldwide
2. **WebSocket Optimization** - Perfect for real-time games
3. **Scaling** - Handle thousands of players
4. **Integration** - Easy database and storage integration
5. **Monitoring** - Detailed game analytics

### 🚀 **Quick Azure Deployment:**

```bash
# If you have Azure CLI installed
az webapp up --name hyper-io-game --resource-group hyper-io-rg --runtime "NODE|18-lts"
```

Your game will be live at: `https://hyper-io-game.azurewebsites.net`

### 📊 **Recommended Setup for Production:**

- **Tier**: Basic B1 ($13/month)
- **Region**: East US or West Europe
- **Runtime**: Node.js 18 LTS
- **WebSockets**: Enabled
- **Always On**: Enabled
- **ARR Affinity**: Disabled (for better load balancing)

Your Hyper.io game is now ready for professional Azure deployment! 🎉
