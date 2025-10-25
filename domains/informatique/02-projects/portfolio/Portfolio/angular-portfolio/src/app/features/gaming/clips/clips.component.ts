import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="clips-section">
      <div class="container">
        <h2>Meilleurs Clips</h2>
        
        <div class="clips-content">
          <div class="clips-filter">
            <button 
              class="filter-btn" 
              [class.active]="selectedFilter === 'all'"
              (click)="filterClips('all')">
              Tous
            </button>
            <button 
              class="filter-btn" 
              [class.active]="selectedFilter === 'ace'"
              (click)="filterClips('ace')">
              Aces
            </button>
            <button 
              class="filter-btn" 
              [class.active]="selectedFilter === 'clutch'"
              (click)="filterClips('clutch')">
              Clutches
            </button>
            <button 
              class="filter-btn" 
              [class.active]="selectedFilter === 'flick'"
              (click)="filterClips('flick')">
              Flicks
            </button>
          </div>

          <div class="clips-grid">
            <div 
              class="clip-card" 
              *ngFor="let clip of filteredClips">
              <div class="clip-thumbnail">
                <div class="thumbnail-placeholder">
                  <div class="play-button">▶️</div>
                  <div class="clip-duration">{{ clip.duration }}</div>
                </div>
                <div class="clip-overlay">
                  <div class="clip-stats">
                    <span class="stat">👁️ {{ clip.views }}</span>
                    <span class="stat">👍 {{ clip.likes }}</span>
                  </div>
                </div>
              </div>
              <div class="clip-info">
                <h3>{{ clip.title }}</h3>
                <p class="clip-description">{{ clip.description }}</p>
                <div class="clip-meta">
                  <span class="clip-agent">{{ clip.agent }}</span>
                  <span class="clip-map">{{ clip.map }}</span>
                  <span class="clip-date">{{ clip.date }}</span>
                </div>
                <div class="clip-actions">
                  <a [href]="clip.url" target="_blank" class="watch-btn">
                    Regarder
                  </a>
                  <button class="share-btn" (click)="shareClip(clip)">
                    Partager
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="highlight-reel">
            <h3>Highlight Reel</h3>
            <div class="reel-container">
              <div class="reel-video">
                <div class="video-placeholder">
                  <div class="play-icon">▶️</div>
                  <p>Compilation des meilleurs moments</p>
                  <small>5 minutes de highlights</small>
                </div>
              </div>
              <div class="reel-stats">
                <div class="stat-item">
                  <span class="stat-value">1.2M</span>
                  <span class="stat-label">Vues</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">45K</span>
                  <span class="stat-label">Likes</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">2.1K</span>
                  <span class="stat-label">Commentaires</span>
                </div>
              </div>
            </div>
          </div>

          <div class="social-links">
            <h3>Suivez-moi</h3>
            <div class="social-grid">
              <a href="https://twitch.tv/valorantpro" target="_blank" class="social-link">
                <span class="social-icon">📺</span>
                <span>Twitch</span>
                <small>25K followers</small>
              </a>
              <a href="https://youtube.com/valorantpro" target="_blank" class="social-link">
                <span class="social-icon">📹</span>
                <span>YouTube</span>
                <small>15K abonnés</small>
              </a>
              <a href="https://twitter.com/valorantpro" target="_blank" class="social-link">
                <span class="social-icon">🐦</span>
                <span>Twitter</span>
                <small>10K followers</small>
              </a>
              <a href="https://tiktok.com/@valorantpro" target="_blank" class="social-link">
                <span class="social-icon">🎵</span>
                <span>TikTok</span>
                <small>50K followers</small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .clips-section {
      padding: 50px 0;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    h2 {
      text-align: center;
      margin-bottom: 50px;
      font-size: 2.5rem;
      font-weight: 700;
      color: #ff4655;
    }

    .clips-content {
      display: grid;
      gap: 40px;
    }

    .clips-filter {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 10px 20px;
      border: 2px solid #ff4655;
      background: transparent;
      color: #ff4655;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
    }

    .filter-btn:hover,
    .filter-btn.active {
      background: #ff4655;
      color: white;
    }

    .clips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .clip-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .clip-card:hover {
      transform: translateY(-5px);
      border-color: #ff4655;
      box-shadow: 0 10px 30px rgba(255, 70, 85, 0.2);
    }

    .clip-thumbnail {
      position: relative;
      height: 200px;
      background: linear-gradient(135deg, #ff4655, #0f1923);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .thumbnail-placeholder {
      text-align: center;
      color: white;
    }

    .play-button {
      font-size: 3rem;
      margin-bottom: 10px;
    }

    .clip-duration {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 0.9rem;
      position: absolute;
      bottom: 10px;
      right: 10px;
    }

    .clip-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .clip-stats {
      display: flex;
      gap: 10px;
    }

    .clip-stats .stat {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .clip-info {
      padding: 25px;
    }

    .clip-info h3 {
      margin: 0 0 15px 0;
      color: white;
      font-size: 1.3rem;
    }

    .clip-description {
      margin: 0 0 20px 0;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
    }

    .clip-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }

    .clip-agent,
    .clip-map,
    .clip-date {
      background: rgba(255, 70, 85, 0.2);
      color: #ff4655;
      padding: 5px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .clip-actions {
      display: flex;
      gap: 10px;
    }

    .watch-btn,
    .share-btn {
      flex: 1;
      padding: 10px 15px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .watch-btn {
      background: #ff4655;
      color: white;
    }

    .watch-btn:hover {
      background: #e63946;
    }

    .share-btn {
      background: rgba(255, 70, 85, 0.2);
      color: #ff4655;
      border: 1px solid #ff4655;
    }

    .share-btn:hover {
      background: #ff4655;
      color: white;
    }

    .highlight-reel {
      text-align: center;
    }

    .highlight-reel h3 {
      font-size: 1.8rem;
      margin-bottom: 30px;
      color: #ff4655;
    }

    .reel-container {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 30px;
    }

    .reel-video {
      margin-bottom: 30px;
    }

    .video-placeholder {
      background: linear-gradient(135deg, #ff4655, #0f1923);
      border-radius: 10px;
      padding: 60px 40px;
      color: white;
    }

    .play-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .video-placeholder p {
      font-size: 1.2rem;
      margin: 0 0 10px 0;
    }

    .video-placeholder small {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .reel-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
    }

    .reel-stats .stat-item {
      text-align: center;
    }

    .reel-stats .stat-value {
      display: block;
      font-size: 1.8rem;
      font-weight: 700;
      color: white;
    }

    .reel-stats .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .social-links h3 {
      font-size: 1.8rem;
      margin-bottom: 30px;
      color: #ff4655;
      text-align: center;
    }

    .social-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .social-link {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      text-decoration: none;
      color: white;
      text-align: center;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .social-link:hover {
      border-color: #ff4655;
      transform: translateY(-5px);
    }

    .social-icon {
      font-size: 2rem;
    }

    .social-link span:not(.social-icon) {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .social-link small {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .clips-grid {
        grid-template-columns: 1fr;
      }
      
      .clips-filter {
        gap: 10px;
      }
      
      .filter-btn {
        padding: 8px 16px;
        font-size: 0.9rem;
      }
      
      .reel-stats {
        flex-direction: column;
        gap: 20px;
      }
      
      .social-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class ClipsComponent {
  selectedFilter = 'all';
  
  clips = [
    {
      title: 'Ace avec Jett sur Bind',
      description: 'Ace incroyable avec Jett en défense, utilisant parfaitement les capacités du personnage.',
      agent: 'Jett',
      map: 'Bind',
      duration: '0:45',
      views: '125K',
      likes: '8.2K',
      date: '2024-01-15',
      category: 'ace',
      url: 'https://youtube.com/watch?v=example1'
    },
    {
      title: '1v4 Clutch avec Reyna',
      description: 'Clutch impossible en 1v4 avec Reyna, montrant une précision exceptionnelle.',
      agent: 'Reyna',
      map: 'Haven',
      duration: '1:20',
      views: '98K',
      likes: '6.5K',
      date: '2024-01-10',
      category: 'clutch',
      url: 'https://youtube.com/watch?v=example2'
    },
    {
      title: 'Flick Headshot à 180°',
      description: 'Flick parfait à 180 degrés pour un headshot instantané.',
      agent: 'Omen',
      map: 'Split',
      duration: '0:15',
      views: '156K',
      likes: '12K',
      date: '2024-01-08',
      category: 'flick',
      url: 'https://youtube.com/watch?v=example3'
    },
    {
      title: 'Ace avec Operator',
      description: 'Ace complet avec l\'Operator, montrant une maîtrise parfaite du sniper.',
      agent: 'Jett',
      map: 'Ascent',
      duration: '0:38',
      views: '89K',
      likes: '5.8K',
      date: '2024-01-05',
      category: 'ace',
      url: 'https://youtube.com/watch?v=example4'
    },
    {
      title: '1v3 Clutch avec Omen',
      description: 'Clutch en 1v3 avec Omen, utilisant parfaitement les smokes.',
      agent: 'Omen',
      map: 'Icebox',
      duration: '1:05',
      views: '76K',
      likes: '4.9K',
      date: '2024-01-03',
      category: 'clutch',
      url: 'https://youtube.com/watch?v=example5'
    },
    {
      title: 'Flick Triple Kill',
      description: 'Triple kill avec des flicks parfaits en succession rapide.',
      agent: 'Reyna',
      map: 'Breeze',
      duration: '0:25',
      views: '112K',
      likes: '7.3K',
      date: '2024-01-01',
      category: 'flick',
      url: 'https://youtube.com/watch?v=example6'
    }
  ];

  get filteredClips() {
    if (this.selectedFilter === 'all') {
      return this.clips;
    }
    return this.clips.filter(clip => clip.category === this.selectedFilter);
  }

  filterClips(filter: string) {
    this.selectedFilter = filter;
  }

  shareClip(clip: any) {
    if (navigator.share) {
      navigator.share({
        title: clip.title,
        text: clip.description,
        url: clip.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(clip.url);
      alert('Lien copié dans le presse-papiers !');
    }
  }
}
