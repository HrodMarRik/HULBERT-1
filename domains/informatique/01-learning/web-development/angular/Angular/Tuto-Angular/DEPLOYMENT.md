# Configuration de déploiement

## Variables d'environnement

### Développement
```bash
# .env.development
NODE_ENV=development
API_URL=http://localhost:8000/api/v1
DEBUG=true
LOG_LEVEL=debug
```

### Production
```bash
# .env.production
NODE_ENV=production
API_URL=https://api.yourdomain.com/api/v1
DEBUG=false
LOG_LEVEL=error
```

## Scripts de déploiement

### Déploiement local
```bash
# Build de production
npm run build:prod

# Test du build
npm run serve:prod
```

### Déploiement Docker
```bash
# Build de l'image
docker build -t tuto-angular .

# Run du container
docker run -p 80:80 tuto-angular
```

### Déploiement avec Docker Compose
```bash
# Démarrage des services
docker-compose up -d

# Arrêt des services
docker-compose down
```

## Configuration serveur

### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gestion des routes Angular
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/html
    
    # Gestion des routes Angular
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Cache des assets statiques
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
</VirtualHost>
```

## Monitoring

### Health Check
```typescript
// src/app/core/services/health.service.ts
@Injectable({
  providedIn: 'root'
})
export class HealthService {
  constructor(private http: HttpClient) {}
  
  checkHealth(): Observable<any> {
    return this.http.get('/api/health');
  }
}
```

### Logging
```typescript
// src/app/core/services/logger.service.ts
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel = environment.production ? 'error' : 'debug';
  
  log(level: string, message: string, data?: any) {
    if (this.shouldLog(level)) {
      console[level](message, data);
    }
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
}
```

## Sécurité

### Headers de sécurité
```typescript
// src/app/core/interceptors/security.interceptor.ts
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://api.yourdomain.com;">
```

## Performance

### Optimisations
- Utilisation d'OnPush change detection
- Lazy loading des modules
- Preloading strategy
- Bundle splitting
- Tree shaking
- Minification et compression

### Monitoring
- Web Vitals
- Bundle analysis
- Performance profiling
- Error tracking
- User analytics
