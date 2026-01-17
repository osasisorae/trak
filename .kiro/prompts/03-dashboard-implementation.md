# Dashboard Implementation Guide

## Overview
Implement the `trak dev` command that launches a local web dashboard for visualizing session data, detected issues, and code quality metrics.

## Implementation Steps

### 1. Create DashboardServer Service

**File**: `src/services/dashboardServer.ts`

```typescript
export class DashboardServer {
  private app: Express;
  private server?: Server;
  private port: number;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async start(preferredPort = 3000): Promise<number> {
    this.port = await this.getAvailablePort(preferredPort);
    // Start server, open browser
    return this.port;
  }

  stop(): Promise<void> {
    // Graceful shutdown
  }

  private async getAvailablePort(startPort: number): Promise<number> {
    // Check port availability, increment if taken
  }
}
```

### 2. API Endpoints

**Routes to implement**:
```typescript
GET /api/sessions - List all sessions
GET /api/sessions/:id - Get specific session with analysis
GET /api/sessions/current - Get active session
GET / - Serve dashboard/index.html
```

### 3. Frontend Structure

**Directory**: `dashboard/`
```
dashboard/
├── index.html          # Main dashboard page
├── css/
│   └── dashboard.css   # Styling
├── js/
│   ├── dashboard.js    # Main logic
│   └── issues.js       # Issue display
```

### 4. Dev Command Implementation

**File**: `src/commands/dev.ts`

```typescript
export async function devCommand() {
  console.log('🚀 Starting Trak Dashboard...');
  
  const server = createDashboardServer();
  const port = await server.start();
  console.log(`📊 Dashboard running at http://localhost:${port}`);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
}
```

## Acceptance Criteria

### Server Functionality
- ✅ Express server starts on available port (3000+)
- ✅ Serves static files from dashboard/ directory
- ✅ API endpoints return correct JSON data
- ✅ Auto-opens browser when server starts

### Frontend Features
- ✅ Displays current session status
- ✅ Shows session history with summaries
- ✅ Lists detected issues with severity indicators
- ✅ Auto-refreshes when new data available
- ✅ Responsive design works on mobile
