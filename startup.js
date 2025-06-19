#!/usr/bin/env node

// Alternative startup script for Azure Web Apps
// This provides better error handling and logging for deployment troubleshooting

console.log('🔧 Starting Hyper.io Game Server...');
console.log('📦 Node.js version:', process.version);
console.log('📦 Platform:', process.platform);
console.log('📦 Architecture:', process.arch);

// Log all environment variables related to Azure and ports
console.log('🔧 Environment variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  WEBSITES_PORT:', process.env.WEBSITES_PORT);
console.log('  WEBSITE_HOSTNAME:', process.env.WEBSITE_HOSTNAME);
console.log('  WEBSITE_SITE_NAME:', process.env.WEBSITE_SITE_NAME);

// Set up error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the main application
try {
    console.log('🚀 Loading main server...');
    require('./server.js');
} catch (error) {
    console.error('❌ Failed to load server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
