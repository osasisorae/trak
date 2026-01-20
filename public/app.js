class Dashboard {
    constructor() {
        this.currentSession = null;
        this.currentActiveSession = null;
        this.sessions = [];
        this.currentFilter = 'all';
        this.isLoading = false;
        this.searchQuery = '';
        this.sortMode = 'newest';
        this.init();
    }

    async init() {
        await this.loadCurrentSession();
        await this.loadSessions();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.updateHeaderStats();
    }

    async loadSessions() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showRefreshIndicator();
        
        try {
            const response = await fetch('/api/sessions');
            this.sessions = await response.json();
            this.renderSessions();
            this.updateHeaderStats();
        } catch (error) {
            this.showError('Failed to load sessions');
        } finally {
            this.isLoading = false;
            this.hideRefreshIndicator();
        }
    }

    async loadCurrentSession() {
        try {
            const response = await fetch('/api/current');
            const session = await response.json();
            this.currentActiveSession = session && session.status === 'active' ? session : null;
        } catch {
            this.currentActiveSession = null;
        }

        this.renderCurrentSessionCard();

        // Keep the details panel live if viewing the current session.
        if (this.currentSession && this.currentSession.status === 'active') {
            this.currentSession = this.currentActiveSession;
            if (this.currentSession) this.renderSessionDetails();
        }
    }

    renderSessions() {
        const container = document.getElementById('sessions-list');
        
        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="empty-icon">📊</div>
                    <p>No sessions found</p>
                    <small>Start tracking with <code>trak start</code></small>
                </div>
            `;
            return;
        }

        const sessions = this.applySearchAndSort(this.sessions);
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="empty-icon">🔎</div>
                    <p>No sessions match your search</p>
                    <small>Try clearing the search box</small>
                </div>
            `;
            return;
        }

        container.innerHTML = sessions.map(session => {
            const duration = this.calculateSessionDuration(session);
            const totalIssues = (session.issueCount?.high || 0) + (session.issueCount?.medium || 0) + (session.issueCount?.low || 0);
            
            return `
                <div class="session-card" data-id="${session.id}">
                    <div class="session-header">
                        <span class="session-time">${this.formatDate(session.startTime)}</span>
                        <span class="quality-badge ${this.getScoreClass(session.qualityScore)}">
                            ${this.getScoreIcon(session.qualityScore)} ${session.qualityScore}/100
                        </span>
                    </div>
                    <div class="session-meta">
                        <span class="session-status">
                            ${session.status === 'active' ? '🟢 Active' : '✅ Completed'}
                        </span>
                        <span class="session-duration">${duration}</span>
                    </div>
                    ${totalIssues > 0 ? `
                        <div class="issue-summary">
                            ${session.issueCount.high > 0 ? `<span class="issue-badge high">🔴 ${session.issueCount.high}</span>` : ''}
                            ${session.issueCount.medium > 0 ? `<span class="issue-badge medium">🟡 ${session.issueCount.medium}</span>` : ''}
                            ${session.issueCount.low > 0 ? `<span class="issue-badge low">🟢 ${session.issueCount.low}</span>` : ''}
                        </div>
                    ` : '<div class="issue-summary"><span class="issue-badge low">🎉 No issues</span></div>'}
                </div>
            `;
        }).join('');
    }

    renderCurrentSessionCard() {
        const container = document.getElementById('current-session-card');
        if (!container) return;

        const session = this.currentActiveSession;
        if (!session) {
            container.innerHTML = '';
            return;
        }

        const started = this.formatDate(session.startTime);
        const elapsed = this.calculateDuration(session.startTime, new Date().toISOString());
        const files = Array.isArray(session.changes) ? session.changes.length : 0;

        container.innerHTML = `
            <div class="current-session-card" data-id="current">
                <div class="current-session-title">
                    <h3>Active session</h3>
                    <span class="current-session-pill">LIVE</span>
                </div>
                <div class="current-session-meta">
                    <span>Started: ${started}</span>
                    <span>${elapsed} · ${files} files</span>
                </div>
            </div>
        `;
    }

    async loadSessionDetails(sessionId) {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            this.currentSession = await response.json();
            this.renderSessionDetails();
            this.highlightActiveSession(sessionId);
        } catch (error) {
            this.showError('Failed to load session details');
        }
    }

    loadActiveSessionDetails() {
        if (!this.currentActiveSession) return;
        this.currentSession = this.currentActiveSession;
        this.currentFilter = 'all';
        this.renderSessionDetails();
        this.highlightActiveSession('current');
    }

    renderSessionDetails() {
        const container = document.getElementById('session-details');
        const session = this.currentSession;

        if (!session) return;

        const isActive = session.status === 'active';
        const duration = session.endTime 
            ? this.calculateDuration(session.startTime, session.endTime)
            : this.calculateDuration(session.startTime, new Date().toISOString());

        const qualityScore = session.analysis?.metrics?.qualityScore;
        const issues = session.analysis?.issues || [];
        const totalIssues = issues.length;
        const qualityClass = isActive ? 'medium' : this.getScoreClass(qualityScore || 0);
        const qualityText = isActive ? '—' : `${qualityScore || 0}/100`;
        const issuesText = isActive ? '—' : `${totalIssues}`;
        const qualityIcon = isActive ? '⏳' : this.getScoreIcon(qualityScore || 0);

        container.innerHTML = `
            <div class="session-header-section">
                <h2 class="session-title">📊 Session Analysis</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <h4>Duration</h4>
                        <div class="value">${duration}</div>
                    </div>
                    <div class="stat-card quality-score-card">
                        <div class="stat-icon">${qualityIcon}</div>
                        <h4>Quality Score</h4>
                        <div class="value quality-badge ${qualityClass}">${qualityText}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📁</div>
                        <h4>Files Changed</h4>
                        <div class="value">${session.changes?.length || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔍</div>
                        <h4>Issues Found</h4>
                        <div class="value">${issuesText}</div>
                    </div>
                </div>
            </div>

            <div class="summary-section">
                <h3>📝 Session Summary</h3>
                <p>${session.summary || (isActive ? 'Tracking in progress. Run <code>trak stop</code> to generate summary and code quality analysis.' : 'No summary available.')}</p>
            </div>

            ${isActive ? this.renderActiveNotice() : `${this.renderFilters()}${this.renderIssues()}`}
            ${this.renderChanges()}
        `;
    }

    renderFilters() {
        const issues = this.currentSession?.analysis?.issues || [];
        const counts = this.getIssueCounts(issues);
        
        return `
            <div class="filters">
                <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    All Issues (${issues.length})
                </button>
                <button class="filter-btn ${this.currentFilter === 'high' ? 'active' : ''}" data-filter="high">
                    🔴 High (${counts.high})
                </button>
                <button class="filter-btn ${this.currentFilter === 'medium' ? 'active' : ''}" data-filter="medium">
                    🟡 Medium (${counts.medium})
                </button>
                <button class="filter-btn ${this.currentFilter === 'low' ? 'active' : ''}" data-filter="low">
                    🟢 Low (${counts.low})
                </button>
            </div>
        `;
    }

    renderIssues() {
        const issues = this.currentSession?.analysis?.issues || [];
        const filteredIssues = this.currentFilter === 'all' 
            ? issues 
            : issues.filter(issue => issue.severity === this.currentFilter);

        if (filteredIssues.length === 0) {
            return `
                <div class="no-issues-state">
                    <div class="celebration">🎉</div>
                    <h3>No issues found!</h3>
                    <p>Your code quality looks great${this.currentFilter !== 'all' ? ` for ${this.currentFilter} priority issues` : ''}.</p>
                </div>
            `;
        }

        const groupedIssues = this.groupIssuesBySeverity(filteredIssues);

        return `
            <div class="issues-section">
                <h3>🔍 Code Issues</h3>
                ${Object.entries(groupedIssues).map(([severity, severityIssues]) => `
                    <div class="issues-group">
                        <div class="issues-group-header">
                            <h4>${this.getSeverityIcon(severity)} ${severity.charAt(0).toUpperCase() + severity.slice(1)} Priority</h4>
                            <span class="issue-badge ${severity}">${severityIssues.length} issues</span>
                        </div>
                        ${severityIssues.map(issue => `
                            <div class="issue-card">
                                <div class="issue-card-header">
                                    <span class="issue-type-badge">${issue.type}</span>
                                    <span class="issue-location">${issue.filePath}:${issue.lineNumber}</span>
                                </div>
                                <div class="issue-description">${issue.description}</div>
                                <div class="issue-suggestion">${issue.suggestion}</div>
                                <button class="github-issue-btn" onclick="dashboard.showGitHubModal('${issue.id}')">
                                    📝 Create GitHub Issue
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderActiveNotice() {
        return `
            <div class="no-issues-state">
                <div class="celebration">🟢</div>
                <h3>Session is active</h3>
                <p>Trak is tracking file changes. Stop the session to generate issues and a calibrated quality score.</p>
            </div>
        `;
    }

    renderChanges() {
        const changes = this.currentSession?.changes || [];
        
        if (changes.length === 0) return '';

        return `
            <div class="changes-section">
                <h3>📁 File Changes</h3>
                <div class="changes-list">
                    ${changes.map(change => `
                        <div class="change-item">
                            <span class="change-type-badge ${change.type}">${this.getChangeIcon(change.type)} ${change.type}</span>
                            <span class="change-path">${change.path}</span>
                            <span class="change-time">${this.formatTime(change.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.session-card')) {
                const sessionId = e.target.closest('.session-card').dataset.id;
                this.loadSessionDetails(sessionId);
            }

            if (e.target.closest('.current-session-card')) {
                this.loadActiveSessionDetails();
            }

            if (e.target.classList.contains('filter-btn')) {
                this.currentFilter = e.target.dataset.filter;
                this.renderSessionDetails();
            }
        });

        const searchInput = document.getElementById('session-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value || '';
                this.renderSessions();
            });
        }

        const sortSelect = document.getElementById('session-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortMode = e.target.value || 'newest';
                this.renderSessions();
            });
        }
    }

    async showGitHubModal(issueId) {
        const issue = this.findIssueById(issueId);
        if (!issue) return;
        
        // Try to detect repository
        let detectedRepo = '';
        let repoDetected = false;
        
        try {
            const response = await fetch('/api/repo-info');
            const repoInfo = await response.json();
            if (repoInfo.success) {
                detectedRepo = repoInfo.repoUrl;
                repoDetected = true;
            }
        } catch (error) {
            console.log('Could not detect repository');
        }
        
        this.showModal(`
            <div class="modal-header">
                <h3>📝 Create GitHub Issue</h3>
                <button class="modal-close" onclick="dashboard.hideModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="issue-preview">
                    <h4>${issue.type} Issue</h4>
                    <p><strong>File:</strong> ${issue.filePath}:${issue.lineNumber}</p>
                    <p><strong>Severity:</strong> ${issue.severity}</p>
                    <p><strong>Description:</strong> ${issue.description}</p>
                </div>
                
                <form id="github-form" onsubmit="dashboard.createGitHubIssue(event, '${issueId}')">
                    <div class="form-group">
                        <label for="repo-url">GitHub Repository:</label>
                        <input type="text" id="repo-url" value="${detectedRepo}" placeholder="e.g., microsoft/vscode" ${repoDetected ? 'readonly' : 'required'}>
                        <small>${repoDetected ? '✅ Auto-detected from Git remote' : 'Enter the repository in "owner/repo" format'}</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" onclick="dashboard.hideModal()" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Create Issue</button>
                    </div>
                </form>
            </div>
        `);
    }

    async createGitHubIssue(event, issueId) {
        event.preventDefault();
        
        const issue = this.findIssueById(issueId);
        const repoUrl = document.getElementById('repo-url').value.trim();
        
        if (!issue || !repoUrl) return;
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/issues/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    issueData: issue,
                    sessionId: this.currentSession.id,
                    repoUrl: repoUrl || undefined // Let backend auto-detect if empty
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.hideModal();
                this.showToast(`✅ GitHub issue created successfully! <a href="${result.issueUrl}" target="_blank">View Issue #${result.issueNumber}</a>`, 'success');
            } else {
                this.showToast(`❌ ${result.error}`, 'error');
            }
            
        } catch (error) {
            this.showToast('❌ Failed to create GitHub issue. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    findIssueById(issueId) {
        const issues = this.currentSession?.analysis?.issues || [];
        return issues.find(issue => issue.id === issueId);
    }

    showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });
    }

    hideModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Remove on click
        toast.addEventListener('click', () => toast.remove());
    }

    highlightActiveSession(sessionId) {
        document.querySelectorAll('.session-card, .current-session-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-id="${sessionId}"]`)?.classList.add('active');
    }

    updateHeaderStats() {
        const totalSessions = this.sessions.length;
        const avgQuality = totalSessions > 0 
            ? Math.round(this.sessions.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / totalSessions)
            : 0;

        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('avg-quality').textContent = avgQuality > 0 ? `${avgQuality}/100` : '-';
    }

    showRefreshIndicator() {
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
            indicator.style.background = 'var(--warning)';
        }
    }

    hideRefreshIndicator() {
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
            indicator.style.background = 'var(--success)';
        }
    }

    groupIssuesBySeverity(issues) {
        return issues.reduce((groups, issue) => {
            const severity = issue.severity;
            if (!groups[severity]) groups[severity] = [];
            groups[severity].push(issue);
            return groups;
        }, {});
    }

    getIssueCounts(issues) {
        return issues.reduce((counts, issue) => {
            counts[issue.severity] = (counts[issue.severity] || 0) + 1;
            return counts;
        }, { high: 0, medium: 0, low: 0 });
    }

    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }

    getScoreIcon(score) {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        return '🔴';
    }

    getSeverityIcon(severity) {
        const icons = { high: '🔴', medium: '🟡', low: '🟢' };
        return icons[severity] || '⚪';
    }

    getChangeIcon(type) {
        const normalized = this.normalizeChangeType(type);
        const icons = { add: '➕', modify: '✏️', delete: '🗑️' };
        return icons[normalized] || '📄';
    }

    normalizeChangeType(type) {
        if (type === 'added' || type === 'add') return 'add';
        if (type === 'modified' || type === 'modify') return 'modify';
        if (type === 'deleted' || type === 'delete') return 'delete';
        return String(type || '');
    }

    calculateSessionDuration(session) {
        if (!session.endTime) return 'Active';
        return this.calculateDuration(session.startTime, session.endTime);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    calculateDuration(start, end) {
        const duration = new Date(end) - new Date(start);
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }

    showError(message) {
        const container = document.getElementById('sessions-list');
        container.innerHTML = `
            <div class="error-state">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <p>${message}</p>
                <button onclick="dashboard.loadSessions()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: none; background: var(--primary); color: white; border-radius: var(--radius); cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    applySearchAndSort(sessions) {
        const q = String(this.searchQuery || '').trim().toLowerCase();
        let filtered = sessions;

        if (q) {
            filtered = sessions.filter((s) => {
                const hay = [
                    s.id,
                    s.startTime,
                    s.endTime,
                    s.status,
                    s.summary || '',
                    String(s.qualityScore || ''),
                ].join(' ').toLowerCase();
                return hay.includes(q);
            });
        }

        const issueTotal = (s) => (s.issueCount?.high || 0) + (s.issueCount?.medium || 0) + (s.issueCount?.low || 0);
        const sorted = filtered.slice();

        switch (this.sortMode) {
            case 'oldest':
                sorted.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                break;
            case 'quality_high':
                sorted.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
                break;
            case 'quality_low':
                sorted.sort((a, b) => (a.qualityScore || 0) - (b.qualityScore || 0));
                break;
            case 'issues_high':
                sorted.sort((a, b) => issueTotal(b) - issueTotal(a));
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                break;
        }

        return sorted;
    }

    startAutoRefresh() {
        setInterval(() => {
            if (!this.isLoading) {
                this.loadCurrentSession();
                this.loadSessions();
            }
        }, 5000);
    }
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});
