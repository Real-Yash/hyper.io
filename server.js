// Azure Web App entry point
// This file serves as the main entry point for Azure Web App deployment

const path = require('path');

// Set environment variables for Azure
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;

// Import and start the actual server
require('./server/src/server.js');
