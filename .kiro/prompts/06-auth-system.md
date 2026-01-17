# Authentication System Implementation Guide

## Overview
Implement the authentication and organization system for team reporting via `trak login` and `trak logout` commands.

## Implementation Steps

### 1. Create AuthManager Service

**File**: `src/services/authManager.ts`

```typescript
export interface TrakConfig {
  organization?: {
    id: string;
    name: string;
    endpoint: string;
    developerId: string;
    token: string;
    lastLogin: string;
  };
}

export class AuthManager {
  private configPath: string;
  private config: TrakConfig;

  constructor() {
    this.configPath = join(os.homedir(), '.trak', 'config.json');
    this.loadConfig();
  }

  async login(orgToken: string): Promise<void> {
    // Validate token format
    if (!this.isValidToken(orgToken)) {
      throw new Error('Invalid organization token format');
    }

    // Validate with organization endpoint
    const orgInfo = await this.validateToken(orgToken);
    
    // Store credentials securely
    await this.storeCredentials(orgToken, orgInfo);
  }

  logout(): void {
    this.config.organization = undefined;
    this.saveConfig();
  }

  isLoggedIn(): boolean {
    return !!this.config.organization?.token;
  }

  async reportSession(session: Session, analysis: AnalysisResult): Promise<void> {
    if (!this.isLoggedIn()) return;

    const report = this.buildSessionReport(session, analysis);
    await this.transmitReport(report);
  }

  private async storeCredentials(token: string, orgInfo: any): Promise<void> {
    // Ensure ~/.trak directory exists
    await this.ensureConfigDirectory();
    
    this.config.organization = {
      id: orgInfo.id,
      name: orgInfo.name,
      endpoint: orgInfo.endpoint,
      developerId: orgInfo.developerId,
      token: token,
      lastLogin: new Date().toISOString()
    };
    
    await this.saveConfig();
    await this.setSecurePermissions();
  }

  private async setSecurePermissions(): Promise<void> {
    // Set 600 permissions (owner read/write only)
    await fs.chmod(this.configPath, 0o600);
  }
}
```

### 2. Login Command

**File**: `src/commands/login.ts`

```typescript
export async function loginCommand(orgToken: string) {
  if (!orgToken) {
    console.log('❌ Organization token required');
    console.log('Usage: trak login <org-token>');
    process.exit(1);
  }

  const authManager = createAuthManager();

  try {
    console.log('🔐 Validating organization token...');
    await authManager.login(orgToken);
    
    const org = authManager.getOrganization();
    console.log('✅ Successfully logged in');
    console.log(`   Organization: ${org.name}`);
    console.log(`   Developer ID: ${org.developerId}`);
    console.log('');
    console.log('Session reports will now be sent to your organization.');
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    process.exit(1);
  }
}
```

### 3. Logout Command

**File**: `src/commands/logout.ts`

```typescript
export async function logoutCommand() {
  const authManager = createAuthManager();

  if (!authManager.isLoggedIn()) {
    console.log('❌ Not currently logged in');
    process.exit(1);
  }

  const org = authManager.getOrganization();
  authManager.logout();

  console.log('✅ Successfully logged out');
  console.log(`   Disconnected from: ${org.name}`);
  console.log('');
  console.log('Session reports will no longer be sent to your organization.');
}
```

### 4. Session Reporting

**Integration with stop command**:

```typescript
// In src/commands/stop.ts
export async function stopCommand() {
  // ... existing stop logic ...

  // Add session reporting
  const authManager = createAuthManager();
  if (authManager.isLoggedIn()) {
    try {
      console.log('📤 Sending session report...');
      await authManager.reportSession(stoppedSession, analysis);
      console.log('✅ Session report sent to organization');
    } catch (error) {
      console.log('⚠️  Failed to send session report:', error.message);
      // Don't fail the stop command if reporting fails
    }
  }
}
```

### 5. Report Structure

```typescript
interface SessionReport {
  developerId: string;
  sessionId: string;
  timestamp: string;
  duration: number; // minutes
  projectPath: string;
  files: {
    added: number;
    modified: number;
    deleted: number;
    paths: string[];
  };
  analysis: {
    qualityScore: number;
    issueCount: {
      high: number;
      medium: number;
      low: number;
    };
    categories: {
      complexity: number;
      duplication: number;
      errorHandling: number;
      security: number;
      performance: number;
    };
  };
  summary: string;
}
```

### 6. Network Handling

```typescript
private async transmitReport(report: SessionReport): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(this.config.organization.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.organization.token}`,
          'User-Agent': 'trak-cli/0.1.0'
        },
        body: JSON.stringify(report),
        timeout: 10000 // 10 second timeout
      });

      if (response.ok) {
        return; // Success
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw new Error(`Failed to send report after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 7. Status Integration

**Update status command to show login status**:

```typescript
// In src/commands/status.ts
export async function statusCommand() {
  // ... existing status logic ...

  // Add auth status
  const authManager = createAuthManager();
  if (authManager.isLoggedIn()) {
    const org = authManager.getOrganization();
    console.log('');
    console.log(`🏢 Organization: ${org.name}`);
    console.log(`👤 Developer ID: ${org.developerId}`);
  } else {
    console.log('');
    console.log('🔓 Not logged in to organization');
    console.log('   Run "trak login <token>" to enable team reporting');
  }
}
```

### 8. Mock Organization Endpoint (for hackathon demo)

**File**: `demo/mock-org-server.js`

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/sessions', (req, res) => {
  console.log('📊 Received session report:');
  console.log(JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    message: 'Session report received',
    reportId: Date.now().toString()
  });
});

app.listen(3001, () => {
  console.log('🏢 Mock organization server running on http://localhost:3001');
});
```

## Environment Variables

```bash
# Optional: Override organization endpoint
export TRAK_ORG_ENDPOINT=https://api.yourorg.com/trak/sessions

# For demo
export TRAK_ORG_ENDPOINT=http://localhost:3001/api/sessions
```

## Acceptance Criteria

### Authentication
- ✅ `trak login <token>` validates and stores credentials
- ✅ Config stored in ~/.trak/config.json with 600 permissions
- ✅ `trak logout` clears all credentials
- ✅ Token validation before storage
- ✅ Clear error messages for invalid tokens

### Session Reporting
- ✅ Reports sent automatically after `trak stop` (if logged in)
- ✅ Report includes all required data (developer ID, session, analysis)
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ Graceful handling of network failures
- ✅ Stop command doesn't fail if reporting fails

### Privacy & Security
- ✅ Secure file permissions on config file
- ✅ No credentials in logs or error messages
- ✅ HTTPS for organization communication
- ✅ User consent for data sharing
- ✅ Clear documentation of what data is sent

### Integration
- ✅ Status command shows login status
- ✅ Works with existing session workflow
- ✅ Environment variable support for endpoint
- ✅ Mock server for demo purposes
