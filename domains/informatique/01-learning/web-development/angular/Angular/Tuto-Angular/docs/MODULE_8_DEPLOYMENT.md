# Module 8 : Déploiement et production

## Objectifs
- Comprendre les stratégies de déploiement
- Configurer l'environnement de production
- Optimiser les performances
- Mettre en place la CI/CD
- Gérer la sécurité en production

## 8.1 Configuration de production

### 8.1.1 Environment de production
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/v1',
  enableLogging: false,
  enableAnalytics: true,
  version: '1.0.0'
};
```

### 8.1.2 Build de production
```json
// angular.json - Configuration de build
{
  "projects": {
    "tuto-angular": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/tuto-angular",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "6kb",
                  "maximumError": "10kb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true,
              "optimization": true,
              "aot": true
            }
          }
        }
      }
    }
  }
}
```

### 8.1.3 Scripts de build
```json
// package.json
{
  "scripts": {
    "build": "ng build",
    "build:prod": "ng build --configuration=production",
    "build:analyze": "ng build --configuration=production --stats-json && npx webpack-bundle-analyzer dist/tuto-angular/stats.json",
    "serve:prod": "ng serve --configuration=production",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
    "e2e": "ng e2e",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix"
  }
}
```

## 8.2 Optimisation des performances

### 8.2.1 Bundle Analysis
```typescript
// src/app/core/services/performance.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private performanceObserver: PerformanceObserver | null = null;
  
  constructor() {
    this.initPerformanceMonitoring();
  }
  
  private initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log('Performance entry:', entry);
        });
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }
  
  measurePerformance(name: string, startMark: string, endMark: string) {
    if ('performance' in window) {
      performance.mark(startMark);
      // ... code à mesurer
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
    }
  }
  
  getWebVitals() {
    return {
      fcp: this.getFirstContentfulPaint(),
      lcp: this.getLargestContentfulPaint(),
      fid: this.getFirstInputDelay(),
      cls: this.getCumulativeLayoutShift()
    };
  }
  
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }
  
  private getLargestContentfulPaint(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
  }
  
  private getFirstInputDelay(): number {
    const fidEntries = performance.getEntriesByType('first-input');
    return fidEntries.length > 0 ? fidEntries[0].processingStart - fidEntries[0].startTime : 0;
  }
  
  private getCumulativeLayoutShift(): number {
    const clsEntries = performance.getEntriesByType('layout-shift');
    return clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0);
  }
}
```

### 8.2.2 Lazy Loading avancé
```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => 
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    data: { preload: true }
  },
  {
    path: 'products',
    loadChildren: () => 
      import('./features/products/products.routes')
        .then(m => m.PRODUCTS_ROUTES),
    data: { preload: false }
  },
  {
    path: 'admin',
    loadChildren: () => 
      import('./features/admin/admin.routes')
        .then(m => m.ADMIN_ROUTES),
    data: { preload: false, requiresAuth: true, roles: ['admin'] }
  }
];
```

### 8.2.3 Preloading Strategy personnalisée
```typescript
// src/app/core/strategies/custom-preloading.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const shouldPreload = route.data?.['preload'] === true;
    
    if (shouldPreload) {
      console.log('Preloading route:', route.path);
      return load();
    }
    
    return of(null);
  }
}
```

## 8.3 Sécurité en production

### 8.3.1 Content Security Policy
```html
<!-- src/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TutoAngular</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  
  <!-- Content Security Policy -->
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; 
                 script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
                 style-src 'self' 'unsafe-inline'; 
                 img-src 'self' data: https:; 
                 font-src 'self' data:; 
                 connect-src 'self' https://api.yourdomain.com;">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### 8.3.2 Security Headers
```typescript
// src/app/core/interceptors/security.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ajouter des headers de sécurité
    const secureReq = req.clone({
      setHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
    
    return next.handle(secureReq);
  }
}
```

### 8.3.3 Input Sanitization
```typescript
// src/app/core/pipes/sanitize.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitize'
})
export class SanitizePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(value: string): SafeHtml {
    return this.sanitizer.sanitize(1, value) || '';
  }
}
```

## 8.4 CI/CD Pipeline

### 8.4.1 GitHub Actions
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Run e2e tests
      run: npm run e2e
    
    - name: Build application
      run: npm run build:prod
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/
    
    - name: Deploy to production
      run: |
        # Script de déploiement
        echo "Deploying to production..."
        # Ici votre script de déploiement
```

### 8.4.2 Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:prod

FROM nginx:alpine AS production
COPY --from=build /app/dist/tuto-angular /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    server {
        listen       80;
        server_name  localhost;
        
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Angular routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 8.5 Monitoring et Logging

### 8.5.1 Error Tracking
```typescript
// src/app/core/services/error-tracking.service.ts
import { Injectable, ErrorHandler } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService implements ErrorHandler {
  handleError(error: any): void {
    if (environment.production) {
      // Envoyer l'erreur à un service de tracking (Sentry, LogRocket, etc.)
      this.sendErrorToService(error);
    } else {
      // En développement, afficher l'erreur dans la console
      console.error('Error:', error);
    }
  }
  
  private sendErrorToService(error: any): void {
    // Implémentation pour envoyer l'erreur à un service externe
    console.log('Sending error to tracking service:', error);
  }
}
```

### 8.5.2 Analytics
```typescript
// src/app/core/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private router: Router) {
    if (environment.enableAnalytics) {
      this.initAnalytics();
    }
  }
  
  private initAnalytics(): void {
    // Initialiser Google Analytics ou autre service
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.url);
      });
  }
  
  trackPageView(url: string): void {
    if (environment.enableAnalytics) {
      // Envoyer l'événement de page view
      console.log('Page view tracked:', url);
    }
  }
  
  trackEvent(eventName: string, parameters?: any): void {
    if (environment.enableAnalytics) {
      // Envoyer l'événement personnalisé
      console.log('Event tracked:', eventName, parameters);
    }
  }
}
```

## 8.6 Déploiement sur différentes plateformes

### 8.6.1 Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/tuto-angular"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 8.6.2 Netlify
```toml
# netlify.toml
[build]
  publish = "dist/tuto-angular"
  command = "npm run build:prod"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 8.6.3 AWS S3 + CloudFront
```bash
# deploy.sh
#!/bin/bash

# Build the application
npm run build:prod

# Upload to S3
aws s3 sync dist/tuto-angular/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 8.7 Exercices pratiques

### Exercice 1 : Configuration de production
Configurez l'environnement de production avec les optimisations nécessaires.

### Exercice 2 : CI/CD Pipeline
Mettez en place un pipeline CI/CD avec GitHub Actions.

### Exercice 3 : Docker
Containerisez l'application avec Docker.

### Exercice 4 : Monitoring
Implémentez le monitoring et le tracking d'erreurs.

### Exercice 5 : Déploiement
Déployez l'application sur une plateforme cloud.

## 8.8 Checklist de production

### Avant le déploiement
- [ ] Tests unitaires et d'intégration passent
- [ ] Build de production sans erreurs
- [ ] Variables d'environnement configurées
- [ ] Sécurité headers configurés
- [ ] Performance optimisée
- [ ] Bundle size analysé

### Après le déploiement
- [ ] Application accessible
- [ ] API fonctionne correctement
- [ ] Monitoring actif
- [ ] Logs configurés
- [ ] Backup configuré
- [ ] SSL/TLS configuré

## 8.9 Ressources supplémentaires

- [Angular Deployment](https://angular.io/guide/deployment)
- [Angular Performance](https://angular.io/guide/performance)
- [Angular Security](https://angular.io/guide/security)
- [Docker Angular](https://angular.io/guide/deployment#docker)
- [CI/CD Angular](https://angular.io/guide/deployment#cicd)

---

**Félicitations !** Vous avez terminé le parcours complet d'apprentissage Angular n-tier !
