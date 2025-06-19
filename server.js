// Azure Web App entry point
// This file serves as the main entry point for Azure Web App deployment

const path = require('path');

// Set environment variables for Azure
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Azure Web Apps use different port environment variables
// WEBSITES_PORT is the primary one, but PORT is also used
const azurePort = process.env.WEBSITES_PORT || process.env.PORT || 8080;
process.env.PORT = azurePort;

console.log('🔧 Azure Entry Point - Starting Hyper.io server...');
console.log(`🔧 Detected Port: ${azurePort}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV}`);

// Import and start the actual server
try {
    require('./server/src/server.js');
} catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
