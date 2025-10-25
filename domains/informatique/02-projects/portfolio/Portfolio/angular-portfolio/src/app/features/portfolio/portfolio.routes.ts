import { Routes } from '@angular/router';
import { PortfolioComponent } from './portfolio.component';
import { PortfolioHomeComponent } from './portfolio-home.component';
import { PortfolioAboutComponent } from './portfolio-about.component';
import { PortfolioProjectsComponent } from './portfolio-projects.component';
import { PortfolioProjectDetailComponent } from './portfolio-project-detail.component';
import { PortfolioBlogComponent } from './portfolio-blog.component';
import { PortfolioBlogDetailComponent } from './portfolio-blog-detail.component';
import { PortfolioContactComponent } from './portfolio-contact.component';

export const portfolioRoutes: Routes = [
  {
    path: '',
    component: PortfolioComponent,
    children: [
      {
        path: '',
        component: PortfolioHomeComponent
      },
      {
        path: 'about',
        component: PortfolioAboutComponent
      },
      {
        path: 'projects',
        component: PortfolioProjectsComponent
      },
      {
        path: 'projects/:id',
        component: PortfolioProjectDetailComponent
      },
      {
        path: 'blog',
        component: PortfolioBlogComponent
      },
      {
        path: 'blog/:slug',
        component: PortfolioBlogDetailComponent
      },
      {
        path: 'contact',
        component: PortfolioContactComponent
      }
    ]
  }
];
