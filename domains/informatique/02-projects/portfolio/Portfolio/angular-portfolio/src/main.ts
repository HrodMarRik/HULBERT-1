import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

(window as any)["API_BASE_URL"] = (location.protocol + '//' + (location.host.includes('localhost') ? 'localhost:8000' : location.host));

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
