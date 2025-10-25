# 🎯 Angular 18 Portfolio - Dual Theme

Un portfolio moderne développé avec Angular 18 qui présente deux facettes : **Développeur Professionnel** et **Joueur Esport Valorant**.

## ✨ Fonctionnalités

### 🎨 **Toggle Theme Smooth**
- Bouton de basculement en haut à droite
- Transition fluide entre les thèmes (0.5s ease-in-out)
- Animation de glissement avec changement d'icônes (💼 ↔ 🎮)
- Persistance du thème choisi dans localStorage

### 💼 **Portfolio Développeur**
- **CV** : Compétences techniques, formation, certifications
- **Expérience** : Timeline professionnelle avec réalisations
- **Projets** : Grille de projets avec filtres par technologie
- **Contact** : Formulaire avec réseaux sociaux professionnels

### 🎮 **Portfolio Gaming Valorant**
- **Profile** : Stats joueur, agents principaux, matchs récents
- **Setup** : Configuration PC, périphériques, paramètres de jeu
- **CV Gaming** : Historique tournois, réalisations, streaming
- **Clips** : Galerie vidéos avec filtres (Aces, Clutches, Flicks)
- **Contact Gaming** : Formulaire spécialisé + coaching

## 🚀 Installation & Déploiement

### Prérequis
- Node.js 18+
- npm 8+
- Angular CLI 18+

### Installation Locale
```bash
# Cloner le repository
git clone https://github.com/somos/angular-portfolio.git
cd angular-portfolio

# Installer les dépendances
npm install

# Démarrer le serveur de développement
ng serve

# Ouvrir dans le navigateur
# http://localhost:4200
```

### Déploiement VPS

#### 1. **Préparation du VPS**
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation d'nginx
sudo apt install nginx -y

# Installation de PM2 pour la gestion des processus
sudo npm install -g pm2
```

#### 2. **Déploiement de l'Application**
```bash
# Cloner sur le VPS
git clone https://github.com/somos/angular-portfolio.git
cd angular-portfolio

# Installer les dépendances
npm install

# Build de production
ng build --configuration=production

# Servir avec PM2
pm2 serve dist/angular-portfolio 4200 --name "portfolio"
pm2 startup
pm2 save
```

#### 3. **Configuration Nginx**
```bash
# Créer la configuration nginx
sudo nano /etc/nginx/sites-available/portfolio
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /path/to/angular-portfolio/dist/angular-portfolio;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. **SSL avec Let's Encrypt (Optionnel)**
```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🛠️ Technologies Utilisées

- **Angular 18** (Standalone Components)
- **TypeScript 5.2+**
- **SCSS** avec variables et mixins
- **RxJS** pour la gestion d'état
- **Angular Animations** pour les transitions
- **Responsive Design** (Mobile-first)

## 📁 Structure du Projet

```
src/
├── app/
│   ├── core/services/
│   │   └── theme.service.ts          # Gestion des thèmes
│   ├── layout/
│   │   ├── header/                   # En-tête avec toggle
│   │   └── toggle-button/            # Bouton de basculement
│   ├── features/
│   │   ├── dev/                      # Portfolio développeur
│   │   │   ├── cv/
│   │   │   ├── experience/
│   │   │   ├── projects/
│   │   │   └── contact/
│   │   └── gaming/                   # Portfolio gaming
│   │       ├── profile/
│   │       ├── setup/
│   │       ├── cv-gaming/
│   │       ├── clips/
│   │       └── contact-gaming/
│   └── app.ts                        # Composant principal
├── styles/
│   ├── _variables.scss              # Variables SCSS
│   ├── _mixins.scss                 # Mixins SCSS
│   └── styles.scss                  # Styles globaux
```

## 🎨 Thèmes

### Thème Développeur
- **Couleurs** : Bleu/Gris professionnel (#3498db → #2c3e50)
- **Style** : Moderne, épuré, professionnel
- **Typographie** : Segoe UI, claire et lisible

### Thème Gaming
- **Couleurs** : Rouge/Noir Valorant (#ff4655 → #0f1923)
- **Style** : Gaming, dynamique, immersif
- **Typographie** : Gaming-friendly, impact visuel

## 📱 Responsive Design

- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px

## 🔧 Scripts Disponibles

```bash
# Développement
ng serve                    # Serveur de développement
ng build                    # Build de développement
ng build --configuration=production  # Build de production

# Tests
ng test                     # Tests unitaires
ng e2e                      # Tests end-to-end

# Linting
ng lint                     # Vérification du code
ng lint --fix               # Correction automatique
```

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Contact

- **GitHub** : [@somos](https://github.com/somos)
- **Portfolio** : [Votre Portfolio](https://votre-domaine.com)

---

**Développé avec ❤️ en Angular 18**