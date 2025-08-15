# GHSM Admin - Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- Node.js 18+ and npm/yarn
- Supabase account and project
- Domain name (for production)
- SSL certificate (recommended: Cloudflare or Let's Encrypt)

### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=GHSM Admin

# Security Settings
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
VITE_ERROR_REPORTING=true

# Optional: Third-party integrations
VITE_GEMINI_API_KEY=your-gemini-key (for AI chat features)
```

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your Project URL and API keys

### 2. Set Up Database Schema
```bash
# Navigate to Supabase SQL Editor and run:
# 1. Execute database/setup.sql
# 2. Execute database/functions.sql
```

### 3. Configure Row Level Security (RLS)
The setup.sql includes RLS policies, but verify:
- All tables have RLS enabled
- Proper policies for admin/instructor/student access
- Test with different user roles

### 4. Set Up Authentication
```sql
-- In Supabase Auth settings:
-- 1. Configure email templates
-- 2. Set up OAuth providers (optional)
-- 3. Configure password requirements
-- 4. Set up MFA (recommended)
```

## 🔧 Application Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repository>
cd ghsm-admin
npm install
```

### 2. Environment Configuration
```bash
# Create production environment file
cp .env.example .env.production

# Edit .env.production with your production values
vim .env.production
```

### 3. Build Application
```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### 4. Data Migration
```bash
# If migrating from existing system:
# 1. Export existing data to CSV/JSON
# 2. Use migration service to import data
# 3. Verify data integrity
```

## 🚀 Deployment Options

### Option 1: Netlify (Recommended)
```bash
# 1. Connect your GitHub repository to Netlify
# 2. Set build command: npm run build
# 3. Set publish directory: dist
# 4. Add environment variables in Netlify dashboard
# 5. Configure custom domain and SSL
```

### Option 2: Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Configure environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Option 3: Traditional VPS/Server
```bash
# 1. Install Node.js and npm on server
# 2. Upload built files to web server
# 3. Configure nginx/apache
# 4. Set up SSL certificate
# 5. Configure process manager (PM2)
```

### Option 4: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## ⚙️ Production Configuration

### 1. Security Headers
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Static file handling
    location / {
        try_files $uri $uri/ /index.html;
        root /usr/share/nginx/html;
        index index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Performance Optimization
```javascript
// vite.config.ts production optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 3. Monitoring and Analytics
```javascript
// Add to main.tsx for production monitoring
if (import.meta.env.PROD) {
  // Error reporting
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to your error reporting service
  });
  
  // Performance monitoring
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
      }
    });
  }).observe({ entryTypes: ['measure'] });
}
```

## 🔒 Security Checklist

### Database Security
- [ ] RLS policies configured for all tables
- [ ] Service role key secured and not exposed
- [ ] Regular database backups configured
- [ ] Database connection limits set
- [ ] Audit logging enabled

### Application Security
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] Rate limiting configured

### Authentication Security
- [ ] Strong password policies
- [ ] MFA enabled for admin accounts
- [ ] Session timeouts configured
- [ ] OAuth providers secured
- [ ] Suspicious activity monitoring

## 📊 Monitoring & Maintenance

### 1. Health Checks
```javascript
// Create health check endpoint
export const healthCheck = {
  database: async () => {
    const { data, error } = await supabase.from('students').select('count');
    return !error;
  },
  
  realtime: async () => {
    // Test realtime connection
    return realtimeService.isConnected();
  },
  
  storage: async () => {
    // Test file storage
    const { data, error } = await supabase.storage.from('avatars').list();
    return !error;
  }
};
```

### 2. Performance Monitoring
```javascript
// Monitor key metrics
const metrics = {
  pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  firstContentfulPaint: performance.getEntriesByType('paint')[0]?.startTime,
  largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
  cumulativeLayoutShift: // CLS measurement
};
```

### 3. Regular Maintenance Tasks
```bash
# Weekly tasks
- Review error logs
- Check database performance
- Monitor disk usage
- Update dependencies (if needed)

# Monthly tasks
- Backup verification
- Security audit
- Performance review
- User feedback analysis

# Quarterly tasks
- Full security assessment
- Disaster recovery testing
- Capacity planning
- Feature usage analysis
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify environment variables
npm run build -- --mode production
```

#### 2. Database Connection Issues
```javascript
// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('students').select('count');
    if (error) throw error;
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

#### 3. Real-time Issues
```javascript
// Debug real-time subscriptions
const debugRealtime = () => {
  const channel = supabase.channel('debug');
  
  channel
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'students' },
      (payload) => console.log('Real-time event:', payload)
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
};
```

#### 4. Performance Issues
```javascript
// Identify slow queries
const analyzeQueries = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 1000) { // Queries taking more than 1s
        console.warn('Slow query detected:', entry);
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
};
```

## 📞 Support & Maintenance

### Emergency Contacts
- Database Issues: Check Supabase status page
- Application Issues: Check deployment platform status
- Domain/SSL Issues: Check DNS provider status

### Backup Procedures
```bash
# Automated daily backups via Supabase
# Manual backup command:
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

# Restore command:
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
```

### Update Procedures
```bash
# 1. Test updates in staging environment
# 2. Schedule maintenance window
# 3. Create database backup
# 4. Deploy new version
# 5. Run smoke tests
# 6. Monitor for issues
```

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection pool usage
- Consider read replicas for heavy read workloads
- Implement query optimization
- Set up database monitoring

### Application Scaling
- Use CDN for static assets
- Implement caching strategies
- Consider serverless functions for heavy operations
- Monitor bundle size and performance

### Cost Optimization
- Monitor Supabase usage and costs
- Optimize database queries
- Implement efficient caching
- Regular cleanup of old data

---

## ✅ Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database schema deployed and tested
- [ ] RLS policies verified
- [ ] Authentication flow tested
- [ ] Admin user created
- [ ] Sample data populated
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Performance tested
- [ ] Security scan completed

### Launch Day
- [ ] DNS records updated
- [ ] SSL certificate installed
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Real-time functionality verified
- [ ] User authentication tested
- [ ] Admin access confirmed
- [ ] Monitoring alerts configured

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] Test user workflows
- [ ] Monitor database performance
- [ ] Check real-time subscriptions
- [ ] Validate security headers

---

**Congratulations! Your GHSM Admin system is now live in production! 🎉**

For ongoing support and updates, refer to the technical documentation and maintain regular monitoring of your deployment.
