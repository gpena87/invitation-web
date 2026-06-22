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

const waitForCompleteLoad = () => {
  return new Promise<void>((resolve) => {
    // Si ya está completamente cargado
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    // Esperar a que el documento esté completamente listo
    window.addEventListener('load', () => {
      // Esperar un poco más para asegurar que todo se renderizó
      setTimeout(() => {
        resolve();
      }, 2000);
    }, { once: true });
  });
};

bootstrapApplication(App, appConfig)
  .then(async () => {
    // Esperar a que el DOM y recursos estén completamente listos
    await waitForCompleteLoad();
    hideStartupLoader();
  })
  .catch((err) => console.error(err));
