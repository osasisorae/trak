import { createDashboardServer } from '../services/dashboardServer.js';
import { exec } from 'child_process';

export async function devCommand(): Promise<void> {
    try {
        const server = await createDashboardServer();
        const port = server.port;
        
        console.log(`🚀 Dashboard server starting on http://localhost:${port}`);
        
        // Auto-open browser
        const url = `http://localhost:${port}`;
        const platform = process.platform;
        const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        
        exec(`${openCommand} ${url}`, (error) => {
            if (error) {
                console.log(`📋 Open manually: ${url}`);
            } else {
                console.log(`🌐 Browser opened to ${url}`);
            }
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down dashboard server...');
            server.server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start dashboard:', error);
        process.exit(1);
    }
}
