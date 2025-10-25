import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="profile-section">
      <div class="container">
        <div class="profile-banner">
          <div class="banner-content">
            <div class="player-avatar">
              <div class="avatar-image">🎮</div>
              <div class="rank-badge">{{ playerData.rank }}</div>
            </div>
            <div class="player-info">
              <h1>{{ playerData.ign }}</h1>
              <p class="player-title">{{ playerData.title }}</p>
              <div class="player-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ playerData.kd }}</span>
                  <span class="stat-label">K/D Ratio</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ playerData.winRate }}%</span>
                  <span class="stat-label">Win Rate</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ playerData.rr }}</span>
                  <span class="stat-label">RR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-content">
          <div class="main-agents">
            <h2>Agents Principaux</h2>
            <div class="agents-grid">
              <div class="agent-card" *ngFor="let agent of playerData.mainAgents">
                <div class="agent-icon">{{ agent.icon }}</div>
                <h3>{{ agent.name }}</h3>
                <p>{{ agent.role }}</p>
                <div class="agent-stats">
                  <span>{{ agent.playtime }}h</span>
                </div>
              </div>
            </div>
          </div>

          <div class="career-stats">
            <h2>Statistiques de Carrière</h2>
            <div class="stats-grid">
              <div class="stat-card" *ngFor="let stat of careerStats">
                <div class="stat-icon">{{ stat.icon }}</div>
                <div class="stat-content">
                  <h3>{{ stat.value }}</h3>
                  <p>{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="recent-matches">
            <h2>Matchs Récents</h2>
            <div class="matches-list">
              <div class="match-item" *ngFor="let match of recentMatches">
                <div class="match-result" [class.win]="match.won" [class.loss]="!match.won">
                  {{ match.won ? 'V' : 'D' }}
                </div>
                <div class="match-info">
                  <div class="match-map">{{ match.map }}</div>
                  <div class="match-score">{{ match.score }}</div>
                  <div class="match-agent">{{ match.agent }}</div>
                </div>
                <div class="match-stats">
                  <span>{{ match.kills }}/{{ match.deaths }}/{{ match.assists }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .profile-section {
      padding: 100px 0 50px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .profile-banner {
      background: linear-gradient(135deg, #ff4655, #0f1923);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 40px;
      position: relative;
      overflow: hidden;
    }

    .profile-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 30px;
      position: relative;
      z-index: 1;
    }

    .player-avatar {
      position: relative;
    }

    .avatar-image {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .rank-badge {
      position: absolute;
      bottom: -10px;
      right: -10px;
      background: #ff4655;
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .player-info h1 {
      margin: 0 0 10px 0;
      font-size: 3rem;
      color: white;
      font-weight: 700;
    }

    .player-title {
      margin: 0 0 20px 0;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .player-stats {
      display: flex;
      gap: 30px;
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

    .profile-content {
      display: grid;
      gap: 40px;
    }

    h2 {
      font-size: 2rem;
      margin-bottom: 30px;
      color: #ff4655;
      text-align: center;
    }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .agent-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      transition: transform 0.3s ease;
    }

    .agent-card:hover {
      transform: translateY(-5px);
      border-color: #ff4655;
    }

    .agent-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .agent-card h3 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 1.3rem;
    }

    .agent-card p {
      margin: 0 0 15px 0;
      color: #ff4655;
      font-weight: 600;
    }

    .agent-stats {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 15px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      text-align: center;
    }

    .stat-content h3 {
      margin: 0 0 5px 0;
      color: white;
      font-size: 1.8rem;
    }

    .stat-content p {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .match-item {
      background: rgba(15, 25, 35, 0.8);
      border: 1px solid rgba(255, 70, 85, 0.3);
      border-radius: 10px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .match-result {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .match-result.win {
      background: #27ae60;
      color: white;
    }

    .match-result.loss {
      background: #e74c3c;
      color: white;
    }

    .match-info {
      flex: 1;
    }

    .match-map {
      font-weight: 600;
      color: white;
      margin-bottom: 5px;
    }

    .match-score {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .match-agent {
      color: #ff4655;
      font-size: 0.9rem;
    }

    .match-stats {
      color: rgba(255, 255, 255, 0.7);
      font-family: monospace;
    }

    @media (max-width: 768px) {
      .banner-content {
        flex-direction: column;
        text-align: center;
      }
      
      .player-info h1 {
        font-size: 2rem;
      }
      
      .player-stats {
        justify-content: center;
        gap: 20px;
      }
      
      .agents-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent {
  playerData = {
    ign: 'ValorantPro',
    title: 'Professional Valorant Player',
    rank: 'Immortal 3',
    kd: '1.45',
    winRate: '68',
    rr: '2450',
    mainAgents: [
      { name: 'Jett', role: 'Duelist', icon: '⚡', playtime: '120' },
      { name: 'Reyna', role: 'Duelist', icon: '👁️', playtime: '95' },
      { name: 'Omen', role: 'Controller', icon: '🌫️', playtime: '80' }
    ]
  };

  careerStats = [
    { icon: '🎯', value: '1,250', label: 'Total Kills' },
    { icon: '💀', value: '862', label: 'Total Deaths' },
    { icon: '🤝', value: '425', label: 'Total Assists' },
    { icon: '🏆', label: 'Tournaments Won', value: '12' },
    { icon: '⭐', value: '4.2', label: 'Average Rating' },
    { icon: '🔥', value: '156', label: 'Aces' }
  ];

  recentMatches = [
    { won: true, map: 'Bind', score: '13-8', agent: 'Jett', kills: 18, deaths: 12, assists: 4 },
    { won: false, map: 'Haven', score: '11-13', agent: 'Reyna', kills: 15, deaths: 14, assists: 6 },
    { won: true, map: 'Split', score: '13-6', agent: 'Omen', kills: 12, deaths: 8, assists: 8 },
    { won: true, map: 'Ascent', score: '13-10', agent: 'Jett', kills: 20, deaths: 13, assists: 3 },
    { won: false, map: 'Icebox', score: '9-13', agent: 'Reyna', kills: 14, deaths: 16, assists: 5 }
  ];
}
