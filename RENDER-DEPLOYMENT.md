# Render.com Deployment Guide

This is the **main branch** optimized for Render.com deployment.

## Quick Deploy to Render

1. Fork or clone this repository
2. Connect your GitHub account to [Render.com](https://render.com)
3. Create a new Web Service
4. Connect this repository (main branch)
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x or latest

## Configuration

- **Entry Point**: `server/src/server.js`
- **Static Files**: Served from `client/` directory
- **Port**: Automatically configured by Render (process.env.PORT)
- **Environment**: Production ready with Socket.IO enabled

## Features

- ✅ WebSocket support (Socket.IO)
- ✅ Static file serving
- ✅ Auto-scaling
- ✅ HTTPS enabled
- ✅ Custom domain support

## Branch Structure

- **main** ← You are here (Render optimized)
- **azure-deployment** ← Azure Web App optimized

## Environment Variables

Render automatically provides:
- `PORT` - Server port
- `NODE_ENV` - Set to 'production'

## Live Demo

Once deployed, your game will be available at:
`https://your-app-name.onrender.com`

## Support

- [Render Documentation](https://render.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
