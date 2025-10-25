import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-gaming',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cv-gaming-section">
      <div class="container">
        <h2>CV Gaming</h2>
        
        <div class="cv-content">
          <div class="player-summary">
            <div class="summary-card">
              <h3>Profil Joueur</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ playerStats.rank }}</span>
                  <span class="stat-label">Rang Actuel</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ playerStats.experience }}</span>
                  <span class="stat-label">Années d'Expérience</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ playerStats.teams }}</span>
                  <span class="stat-label">Équipes</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tournament-history">
            <h3>Historique des Tournois</h3>
            <div class="tournaments-timeline">
              <div class="tournament-item" *ngFor="let tournament of tournaments">
                <div class="tournament-marker"></div>
                <div class="tournament-card">
                  <div class="tournament-header">
                    <h4>{{ tournament.name }}</h4>
                    <span class="tournament-date">{{ tournament.date }}</span>
                    <span class="tournament-place" [class]="getPlaceClass(tournament.place)">
                      {{ tournament.place }}
                    </span>
                  </div>
                  <div class="tournament-details">
                    <p><strong>Équipe:</strong> {{ tournament.team }}</p>
                    <p><strong>Prize Pool:</strong> {{ tournament.prize }}</p>
                    <p><strong>Format:</strong> {{ tournament.format }}</p>
                  </div>
                  <div class="tournament-stats">
                    <span class="stat">K/D: {{ tournament.kd }}</span>
                    <span class="stat">Rating: {{ tournament.rating }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="achievements">
            <h3>Réalisations</h3>
            <div class="achievements-grid">
              <div class="achievement-card" *ngFor="let achievement of achievements">
                <div class="achievement-icon">{{ achievement.icon }}</div>
                <div class="achievement-content">
                  <h4>{{ achievement.title }}</h4>
                  <p>{{ achievement.description }}</p>
                  <span class="achievement-date">{{ achievement.date }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="streaming-content">
            <h3>Contenu & Streaming</h3>
            <div class="content-stats">
              <div class="content-item">
                <div class="content-icon">📺</div>
                <div class="content-info">
                  <h4>Twitch Streamer</h4>
                  <p>{{ streamingStats.followers }} followers</p>
                  <p>{{ streamingStats.hours }} heures streamées</p>
                </div>
              </div>
              <div class="content-item">
                <div class="content-icon">📹</div>
                <div class="content-info">
                  <h4>YouTube Creator</h4>
                  <p>{{ streamingStats.subscribers }} abonnés</p>
                  <p>{{ streamingStats.videos }} vidéos</p>
                </div>
              </div>
              <div class="content-item">
                <div class="content-icon">🎥</div>
                <div class="content-info">
                  <h4>Coach Valorant</h4>
                  <p>{{ streamingStats.students }} étudiants</p>
                  <p>{{ streamingStats.sessions }} sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cv-gaming-section {
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

    .cv-content {
      display: grid;
      gap: 40px;
    }

    h3 {
      font-size: 1.8rem;
      margin-bottom: 30px;
      color: #ff4655;
      text-align: center;
    }

    .summary-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 30px;
      text-align: center;
    }

    .summary-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .tournaments-timeline {
      position: relative;
      padding-left: 30px;
    }

    .tournaments-timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #ff4655, #fd4556);
    }

    .tournament-item {
      position: relative;
      margin-bottom: 30px;
    }

    .tournament-marker {
      position: absolute;
      left: -22px;
      top: 20px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ff4655;
      border: 3px solid rgba(15, 25, 35, 0.8);
    }

    .tournament-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      margin-left: 20px;
    }

    .tournament-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .tournament-header h4 {
      margin: 0;
      color: white;
      font-size: 1.3rem;
    }

    .tournament-date {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .tournament-place {
      padding: 5px 12px;
      border-radius: 15px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .tournament-place.first {
      background: #f39c12;
      color: white;
    }

    .tournament-place.second {
      background: #95a5a6;
      color: white;
    }

    .tournament-place.third {
      background: #e67e22;
      color: white;
    }

    .tournament-place.top8 {
      background: rgba(255, 70, 85, 0.3);
      color: #ff4655;
    }

    .tournament-details p {
      margin: 5px 0;
      color: rgba(255, 255, 255, 0.8);
    }

    .tournament-stats {
      margin-top: 15px;
      display: flex;
      gap: 20px;
    }

    .tournament-stats .stat {
      color: #ff4655;
      font-weight: 600;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .achievement-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .achievement-icon {
      font-size: 2.5rem;
      width: 60px;
      text-align: center;
    }

    .achievement-content h4 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 1.2rem;
    }

    .achievement-content p {
      margin: 0 0 10px 0;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
    }

    .achievement-date {
      color: #ff4655;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .content-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .content-item {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .content-icon {
      font-size: 2.5rem;
      width: 60px;
      text-align: center;
    }

    .content-info h4 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 1.2rem;
    }

    .content-info p {
      margin: 5px 0;
      color: rgba(255, 255, 255, 0.8);
    }

    @media (max-width: 768px) {
      .summary-stats {
        flex-direction: column;
        gap: 20px;
      }
      
      .tournament-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .achievements-grid {
        grid-template-columns: 1fr;
      }
      
      .content-stats {
        grid-template-columns: 1fr;
      }
      
      .achievement-card,
      .content-item {
        flex-direction: column;
        text-align: center;
      }
      
      h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class CvGamingComponent {
  playerStats = {
    rank: 'Immortal 3',
    experience: '3+',
    teams: '5'
  };

  tournaments = [
    {
      name: 'Valorant Champions Tour',
      date: '2024',
      place: '1st',
      team: 'Team Phoenix',
      prize: '$50,000',
      format: 'BO3',
      kd: '1.52',
      rating: '4.8'
    },
    {
      name: 'Red Bull Campus Clutch',
      date: '2023',
      place: '2nd',
      team: 'Team Phoenix',
      prize: '$25,000',
      format: 'BO3',
      kd: '1.38',
      rating: '4.2'
    },
    {
      name: 'Game Changers',
      date: '2023',
      place: '3rd',
      team: 'Team Phoenix',
      prize: '$15,000',
      format: 'BO3',
      kd: '1.45',
      rating: '4.1'
    },
    {
      name: 'VCT Challengers',
      date: '2023',
      place: 'Top 8',
      team: 'Team Phoenix',
      prize: '$8,000',
      format: 'BO3',
      kd: '1.32',
      rating: '3.9'
    }
  ];

  achievements = [
    {
      icon: '🏆',
      title: 'Champion VCT 2024',
      description: 'Victoire en finale contre les meilleures équipes mondiales',
      date: '2024'
    },
    {
      icon: '⭐',
      title: 'MVP Tournament',
      description: 'Meilleur joueur du tournoi avec le plus haut rating',
      date: '2024'
    },
    {
      icon: '🎯',
      title: 'Ace Master',
      description: 'Plus de 100 aces en compétition officielle',
      date: '2023'
    },
    {
      icon: '📈',
      title: 'Rising Star',
      description: 'Reconnaissance comme joueur prometteur de l\'année',
      date: '2023'
    }
  ];

  streamingStats = {
    followers: '25K',
    hours: '500+',
    subscribers: '15K',
    videos: '120',
    students: '200+',
    sessions: '500+'
  };

  getPlaceClass(place: string): string {
    if (place.includes('1st')) return 'first';
    if (place.includes('2nd')) return 'second';
    if (place.includes('3rd')) return 'third';
    return 'top8';
  }
}
