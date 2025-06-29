# CLAUDE.md - Async Code Project Guide

## Project Overview
Full-stack AI code automation platform with mobile-optimized frontend and Flask API backend.

## Deployment Configuration

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

## Authentication System

### Current Setup: SimpleAuth Layer
- **Username**: `chirag`
- **Password**: `CHIRAG1313vadercoder`
- **Implementation**: `/components/simple-auth.tsx` wrapper
- **Context**: `/contexts/mock-auth-context.tsx` (not real Supabase auth)

### Important: Supabase Auth Disabled
The app uses mock auth context to avoid "supabaseUrl is required" errors while maintaining Supabase for data operations.

## Mobile Optimizations Implemented

### Touch Targets
- All buttons/inputs ≥44px (Apple/Android standards)
- Enhanced button variants in `/components/ui/button.tsx`

### Responsive Design
- Mobile-first CSS in `/app/globals.css`
- Responsive navigation with hamburger menu
- PWA manifest for app-like experience

### Viewport Configuration
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

## Deployment Workflow

### Standard Deployment
```bash
# On local machine
git add -A && git commit -m "Changes" && git push origin main

# On server
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "cd /opt/async-code && git pull origin main"
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "cd /opt/async-code/async-code-web && npm run build"
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "pm2 restart async-code-web"
```

### Quick Status Check
```bash
sshpass -p "CHIRAG1313c" ssh root@139.59.14.136 "pm2 status && pm2 logs async-code-web --lines 5 --nostream"
```

## Lessons Learned

### 1. Auth Context Management
**Problem**: Mixed auth systems caused Supabase initialization errors
**Solution**: Use mock auth context when not using real Supabase auth
**Location**: `/contexts/mock-auth-context.tsx` vs `/contexts/auth-context.tsx`

### 2. Environment Variable Handling
**Problem**: Missing env vars causing crashes in production
**Solution**: Add graceful fallbacks in Supabase client initialization
**Implementation**: Check for env vars before creating client

### 3. PM2 Service Naming
**Important**: Service names don't always match expectations
- Frontend: `async-code-web` (not `async-code-frontend`)
- Backend: `async-code-api`
- Always check `pm2 status` for exact names

### 4. Build Verification
**Critical**: Always test build locally before deployment
```bash
npm run build  # Must pass without TypeScript errors
```

### 5. Remote Deployment Pattern
**Efficient**: Use sshpass for automated remote deployment
```bash
sshpass -p "PASSWORD" ssh user@server "commands"
```

## Testing & Verification

### Frontend Health Check
```bash
curl -I https://claudegod.narraite.xyz
# Should return HTTP/1.1 200 OK
```

### Backend API Check
```bash
curl -s https://claudegod.narraite.xyz/api/health
# Note: May route through frontend, check nginx config
```

### Log Monitoring
```bash
pm2 logs async-code-web --lines 20
pm2 logs async-code-api --lines 20
```

## File Structure Notes

### Key Configuration Files
- `/app/layout.tsx` - Root layout with auth provider
- `/components/simple-auth.tsx` - Authentication wrapper  
- `/lib/supabase.ts` - Database client with error handling
- `/.env.local` - Environment variables (frontend)
- `/server/.env` - Environment variables (backend)

### Build Artifacts
- `/.next/` - Next.js build output
- Keep `.env.local` for environment variables

## Common Issues & Solutions

### "supabaseUrl is required" Error
- **Cause**: Real auth context trying to initialize Supabase
- **Fix**: Use mock auth context in layout.tsx
- **Prevention**: Environment variable validation in lib/supabase.ts

### PM2 Restart Failures  
- **Cause**: Wrong service name or missing build
- **Fix**: Check `pm2 status` for exact names, ensure `npm run build` succeeded

### Build TypeScript Errors
- **Cause**: Unused files with type errors still checked by compiler
- **Fix**: Fix or exclude problematic files, use proper typing

## Environment Variables Reference

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://onqdnjzhuehbyvhzihkm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Backend (.env)
```bash
SUPABASE_URL=https://onqdnjzhuehbyvhzihkm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

*Documentation for Async Code deployment and development workflows*