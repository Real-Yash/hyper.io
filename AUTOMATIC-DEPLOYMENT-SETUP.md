# 🚀 Automatic Deployment Setup Guide

This guide explains how to set up automatic deployments for both hosting platforms.

## 📋 Overview

- **main branch** → Render.com (✅ Auto-deploy ready)
- **azure-deployment branch** → Azure Web App (⚙️ Needs setup)

## 🎯 Render.com Automatic Deployment (READY)

### ✅ Already Configured
Your main branch is already set up for automatic deployment to Render.com!

### How it works:
1. Push code to `main` branch
2. Render detects the `render.yaml` file
3. Automatically builds and deploys your app
4. App is live at your Render URL

### To deploy:
```bash
git checkout main
git add .
git commit -m "Your changes"
git push origin main
```

## 🔧 Azure Web App Automatic Deployment (SETUP NEEDED)

### Step 1: Azure Dashboard Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Web App (`hyper-io-game`)
3. Go to **Deployment Center**
4. Choose **GitHub** as source
5. Authorize GitHub access
6. Select repository: `Real-Yash/hyper.io`
7. Select branch: `azure-deployment`
8. Select workflow: Use existing workflow
9. Click **Save**

### Step 2: GitHub Secrets Setup
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

#### Required Secret:
- **Name**: `AZUREAPPSERVICE_PUBLISHPROFILE`
- **Value**: Download from Azure Portal → Your Web App → Get publish profile

### Step 3: Get Publish Profile
1. In Azure Portal, go to your Web App
2. Click **Get publish profile** (download .publishsettings file)
3. Open the file in notepad
4. Copy the entire XML content
5. Paste it as the value for `AZUREAPPSERVICE_PUBLISHPROFILE` secret

### Step 4: Update Workflow (if needed)
Update the app name in `.github/workflows/azure-deploy.yml`:
```yaml
app-name: 'your-actual-azure-app-name'  # Replace with your app name
```

## 🚀 How Automatic Deployment Works

### For Render.com:
```bash
# Push to main branch
git checkout main
git push origin main
# → Render automatically deploys
```

### For Azure Web App:
```bash
# Push to azure-deployment branch  
git checkout azure-deployment
git push origin azure-deployment
# → GitHub Actions triggers Azure deployment
```

## 📊 Monitoring Deployments

### Render.com:
- Check deployment logs in Render Dashboard
- Monitor at: https://dashboard.render.com

### Azure Web App:
- Check GitHub Actions tab for deployment status
- Monitor at: https://github.com/Real-Yash/hyper.io/actions
- Check Azure Portal for app status

## 🔄 Workflow Examples

### Feature Development:
```bash
# Work on features in main branch (Render)
git checkout main
# Make changes
git add .
git commit -m "Add new feature"
git push origin main
# → Automatically deploys to Render
```

### Production Deployment:
```bash
# Merge stable changes to azure-deployment
git checkout azure-deployment
git merge main
git push origin azure-deployment  
# → Automatically deploys to Azure
```

## 🛠️ Troubleshooting

### Render Deployment Issues:
- Check `render.yaml` configuration
- Verify build logs in Render dashboard
- Ensure `npm start` works locally

### Azure Deployment Issues:
- Check GitHub Actions logs
- Verify Azure publish profile secret
- Check Azure App Service logs
- Ensure `node server.js` starts correctly

## 🎉 Next Steps

1. **Set up Azure secrets** (follow Step 2 above)
2. **Test both deployments** by pushing to respective branches
3. **Monitor deployment logs** to ensure everything works
4. **Enjoy automatic deployments!** 🚀

---

**Important**: Always test locally before pushing to production branches!
