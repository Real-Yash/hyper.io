# 🎯 **Branch Structure Overview**

This repository now uses a streamlined branch structure for different deployment targets:

## 📋 **Branch Organization**

### 🚀 **main** → **Azure Web App** (Primary Production)
- **Purpose**: Production deployment to Azure Web App
- **Auto-Deploy**: ✅ Push to main = Auto-deploy to Azure
- **Configuration**: Optimized for Azure Web App with `server.js` entry point
- **Workflow**: `.github/workflows/azure-deploy.yml`

### 🎨 **render** → **Render.com** (Alternative Hosting)
- **Purpose**: Alternative deployment to Render.com
- **Auto-Deploy**: ✅ Push to render = Auto-deploy to Render
- **Configuration**: Optimized for Render with `render.yaml`
- **Entry Point**: `server/src/server.js`

## 🔄 **Deployment Workflows**

### **For Azure (main branch):**
```bash
git checkout main
git add .
git commit -m "Your changes"
git push origin main  # ← Triggers Azure deployment
```

### **For Render (render branch):**
```bash
git checkout render
git add .
git commit -m "Your changes"  
git push origin render  # ← Triggers Render deployment
```

## ⚙️ **Configuration Differences**

| Feature | main (Azure) | render (Render) |
|---------|--------------|-----------------|
| Entry Point | `server.js` | `server/src/server.js` |
| Port Config | `WEBSITES_PORT` or `PORT` | `PORT` |
| Static Files | Azure Web App | Render |
| WebSockets | Enabled via `web.config` | Native support |
| Auto-Deploy | GitHub Actions | `render.yaml` |

## 🛠️ **Setup Requirements**

### **Azure Deployment (main):**
1. Add GitHub secret: `AZUREAPPSERVICE_PUBLISHPROFILE`
2. Update app name in workflow: `app-name: 'your-azure-app-name'`
3. Push to main branch

### **Render Deployment (render):**
1. Connect GitHub repository to Render
2. Select `render` branch
3. Deploy automatically via `render.yaml`

## 📊 **Monitoring**

- **Azure**: GitHub Actions tab + Azure Portal
- **Render**: Render Dashboard + GitHub integration

---

**Default Production**: Azure Web App (main branch)
**Alternative**: Render.com (render branch)
