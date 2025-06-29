# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker-based Development (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Development mode with hot reload
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Development
```bash
# Frontend (Next.js)
cd async-code-web
npm install
npm run dev  # Starts on http://localhost:3000

# Backend (Flask)
cd server
pip install -r requirements.txt
python main.py  # Starts on http://localhost:5000
```

### Build Commands
```bash
# Frontend build
cd async-code-web && npm run build

# Frontend linting
cd async-code-web && npm run lint

# Production deployment
NODE_ENV=production docker-compose up --build -d
```

### Database Setup
```bash
# Initialize Supabase tables
# Run db/init_supabase.sql in Supabase SQL editor
```

## Architecture Overview

### Core System Design
This is a **parallel AI code agent platform** that executes multiple AI-powered coding tasks simultaneously in isolated Docker containers. The system orchestrates Claude Code, Codex, and other AI agents to perform code modifications across GitHub repositories.

### Multi-Layer Architecture

**Frontend Layer (async-code-web/)**
- Next.js 15 with TypeScript and TailwindCSS
- Real-time task monitoring and comparison interface
- Supabase authentication and data management
- CodeMirror-based diff viewer and settings editor

**Backend Layer (server/)**
- Flask API with modular blueprint architecture
- Docker container orchestration for isolated task execution
- Supabase database operations with RLS (Row Level Security)
- OAuth and API key dual authentication system

**Execution Layer**
- Containerized AI agents (Claude Code, Codex) with specialized Docker images
- Git workflow automation (clone → modify → commit → patch generation)
- Parallel task execution with resource management and conflict prevention

### Key Data Flow

1. **Task Creation**: User submits coding tasks through web interface
2. **Authentication Resolution**: System determines OAuth vs API key authentication per user
3. **Container Orchestration**: Spins up isolated Docker containers with proper credentials
4. **AI Execution**: Claude Code/Codex performs code modifications in sandboxed environment
5. **Result Aggregation**: Git patches, diffs, and metadata collected for PR creation
6. **Parallel Comparison**: Multiple agents can work on same task for output comparison

### Authentication Architecture

**Dual Authentication System**:
- **API Key Authentication**: Traditional `ANTHROPIC_API_KEY` approach
- **OAuth Authentication**: Claude Max subscribers using access/refresh tokens
- **Priority Order**: User OAuth → Global OAuth → API Key fallback
- **Automatic Token Refresh**: OAuth tokens validated and refreshed before each task execution

### Database Schema (Supabase)

**Core Tables**:
- `users`: User profiles with preferences (including OAuth tokens)
- `projects`: GitHub repository configurations per user
- `tasks`: Task execution tracking with chat_messages, git_diff, git_patch

**Key Features**:
- Row Level Security (RLS) for multi-tenant isolation
- JSONB fields for flexible metadata storage
- Auto-sync triggers between auth.users and public.users

### Container Execution Model

**Specialized Images**:
- `claude-code-automation:latest`: Contains Claude Code CLI with OAuth support
- `codex-automation:latest`: Contains Codex CLI with enhanced privileges

**Execution Flow**:
1. Clone target repository with GitHub token authentication
2. Configure AI agent credentials (OAuth or API key)
3. Execute AI agent with user prompt in isolated environment
4. Generate git patches and diffs for later PR creation
5. Clean up containers with comprehensive orphan removal

### Code Organization Patterns

**Backend Modules**:
- `main.py`: Flask app entry point with blueprint registration
- `tasks.py`: Task CRUD operations and execution orchestration
- `projects.py`: Project management and GitHub integration
- `database.py`: Supabase operations with user preference management
- `utils/code_task_v2.py`: Core container execution logic with OAuth support
- `utils/claude_oauth.py`: OAuth token lifecycle management

**Frontend Structure**:
- `app/`: Next.js App Router with nested layouts
- `components/`: Reusable UI components with shadcn/ui
- `lib/`: API services and Supabase client configuration
- `contexts/`: Authentication context with mock support
- `hooks/`: Custom React hooks for data fetching

### Environment Configuration

**Backend (.env)**:
```bash
# Authentication Options
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_ACCESS_TOKEN=your_oauth_access_token_here
CLAUDE_REFRESH_TOKEN=your_oauth_refresh_token_here
CLAUDE_EXPIRES_AT=1234567890
CLAUDE_USE_OAUTH=false

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Docker
DOCKER_HOST=unix:///var/run/docker.sock
```

### OAuth Implementation Details

**Token Management**:
- `ClaudeOAuthManager` class handles complete token lifecycle
- Automatic token refresh with 5-minute buffer before expiration
- User preferences updated when tokens are refreshed
- Fallback to API key authentication on OAuth failures

**Container Integration**:
- OAuth tokens passed as environment variables to containers
- `~/.claude/.credentials.json` generated in containers for Claude Code CLI
- Proper error handling for token validation and refresh failures

### Development Considerations

**Container Development**:
- All AI agent executions happen in isolated Docker containers
- Container names include UUIDs to prevent conflicts in parallel execution
- Comprehensive cleanup of orphaned containers on startup and failure
- Docker socket mounting required for container orchestration

**Database Operations**:
- All database operations use Supabase client with service role key
- User preferences stored as JSONB for flexible OAuth and environment configuration
- Task execution metadata includes timing, errors, and git workflow details

**Error Handling**:
- Comprehensive logging throughout the execution pipeline
- OAuth token refresh failures handled gracefully with API key fallback
- Container execution timeouts and resource cleanup
- Database transaction rollback on task failures

### Testing and Debugging

**Backend Testing**:
```bash
# Test API endpoints
./test-api.sh

# Test model selection
./test-model-selection.sh
```

**OAuth Testing**:
- Configure valid OAuth tokens in user preferences
- Submit tasks and monitor token refresh in logs
- Test fallback behavior with invalid OAuth tokens

**Container Debugging**:
- Use `docker-compose logs -f backend` to monitor container orchestration
- Set `FLASK_DEBUG=True` for detailed OAuth logging
- Monitor Docker container lifecycle with `docker ps -a`

---

## Production Deployment Configuration

### Production Environment
- **Server**: DigitalOcean droplet (139.59.14.136)
- **Domain**: https://claudegod.narraite.xyz
- **Frontend**: Next.js 15.3.3 on port 3000 via PM2
- **Backend**: Flask API on port 5000 via PM2
- **Reverse Proxy**: Nginx with SSL (Let's Encrypt)
- **Database**: Supabase (configured but using SimpleAuth)

### SSH Access
```bash
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "command"
```

### PM2 Services
```bash
pm2 status
# Shows: async-code-web, async-code-api, agent-bot
```

### Authentication System

**Current Setup: SimpleAuth Layer**
- **Username**: `chirag`
- **Password**: `CHIRAG1313vadercoder`
- **Implementation**: `/components/simple-auth.tsx` wrapper
- **Context**: `/contexts/mock-auth-context.tsx` (not real Supabase auth)

**Important**: Supabase Auth Disabled - The app uses mock auth context to avoid "supabaseUrl is required" errors while maintaining Supabase for data operations.

### Mobile Optimizations Implemented

**Touch Targets**:
- All buttons/inputs ≥44px (Apple/Android standards)
- Enhanced button variants in `/components/ui/button.tsx`

**Responsive Design**:
- Mobile-first CSS in `/app/globals.css`
- Responsive navigation with hamburger menu
- PWA manifest for app-like experience

**Viewport Configuration**:
```typescript
// In app/layout.tsx
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
};
```

### Deployment Workflow

**Standard Deployment**:
```bash
# On local machine
git add -A && git commit -m "Changes" && git push origin main

# On server
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "cd /opt/async-code && git pull origin main"
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "cd /opt/async-code/async-code-web && npm run build"
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "pm2 restart async-code-web"
```

**Quick Status Check**:
```bash
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "pm2 status && pm2 logs async-code-web --lines 5 --nostream"
```

### Common Issues & Solutions

**"supabaseUrl is required" Error**:
- **Cause**: Real auth context trying to initialize Supabase
- **Fix**: Use mock auth context in layout.tsx
- **Prevention**: Environment variable validation in lib/supabase.ts

**PM2 Restart Failures**:
- **Cause**: Wrong service name or missing build
- **Fix**: Check `pm2 status` for exact names, ensure `npm run build` succeeded

**Build TypeScript Errors**:
- **Cause**: Unused files with type errors still checked by compiler
- **Fix**: Fix or exclude problematic files, use proper typing