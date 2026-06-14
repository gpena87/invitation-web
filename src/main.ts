import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const hideStartupLoader = () => {
  const loader = document.getElementById('app-start-loader');
  if (!loader) {
    return;
  }

  loader.classList.add('is-hidden');
  window.setTimeout(() => loader.remove(), 280);
};

bootstrapApplication(App, appConfig)
  .then(() => {
    if (document.readyState === 'complete') {
      hideStartupLoader();
      return;
    }

    window.addEventListener('load', hideStartupLoader, { once: true });
  })
  .catch((err) => console.error(err));
