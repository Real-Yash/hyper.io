# Azure Web App Deployment Instructions

## Deploy to Azure Web App (Node.js)

### Prerequisites
- Azure account
- Azure CLI installed

### Quick Deployment Steps

1. **Create Azure Web App**:
```bash
# Login to Azure
az login

# Create resource group
az group create --name hyper-io-rg --location "East US"

# Create App Service plan
az appservice plan create --name hyper-io-plan --resource-group hyper-io-rg --sku FREE --is-linux

# Create Web App
az webapp create --resource-group hyper-io-rg --plan hyper-io-plan --name hyper-io-game --runtime "NODE|18-lts"
```

2. **Configure Azure Web App**:
```bash
# Enable WebSocket support (required for Socket.IO)
az webapp config set --resource-group hyper-io-rg --name hyper-io-game --web-sockets-enabled true

# Set startup file
az webapp config set --resource-group hyper-io-rg --name hyper-io-game --startup-file "server.js"

# Configure app settings
az webapp config appsettings set --resource-group hyper-io-rg --name hyper-io-game --settings NODE_ENV=production
```

3. **Deploy from GitHub**:
```bash
# Configure GitHub deployment
az webapp deployment source config --resource-group hyper-io-rg --name hyper-io-game --repo-url https://github.com/Real-Yash/hyper.io --branch azure-deployment --manual-integration
```

### Alternative: Deploy via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Create new "Web App"
3. Configure:
   - **Runtime**: Node.js 18 LTS
   - **OS**: Linux
   - **Pricing**: Free F1
4. In deployment center:
   - **Source**: GitHub
   - **Repository**: Real-Yash/hyper.io
   - **Branch**: azure-deployment
5. Enable WebSockets in Configuration > General settings

### Azure-Specific Features

- **Auto-scaling**: Available on higher tiers
- **Custom domains**: Supported
- **SSL certificates**: Free Let's Encrypt or custom
- **Monitoring**: Application Insights integration
- **CI/CD**: GitHub Actions integration

### Environment Variables
- `NODE_ENV`: production
- `PORT`: Automatically set by Azure
- `WEBSITES_PORT`: Alternative port setting

### Your Game URL
After deployment: `https://hyper-io-game.azurewebsites.net`

### Monitoring
- Application Insights for performance
- Log streaming for debugging
- Metrics and alerts available

## Free Tier Limitations
- 60 CPU minutes/day
- 1 GB bandwidth
- Always On not available (may sleep after 20 mins)

## Troubleshooting
- Check logs: `az webapp log tail --resource-group hyper-io-rg --name hyper-io-game`
- Enable logging: `az webapp log config --resource-group hyper-io-rg --name hyper-io-game --web-server-logging filesystem`
