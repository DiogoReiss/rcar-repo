import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import App from './app/app';
import { registerServiceWorker } from './pwa';

bootstrapApplication(App, appConfig)
  .then(() => registerServiceWorker())
  .catch((err) => console.error(err));
