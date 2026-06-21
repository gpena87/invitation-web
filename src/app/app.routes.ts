import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
    loadComponent: () => import('./pages/home/home-page.component'),
	},
  {
    path: 'spotify-callback',
    loadComponent: () => import('./pages/home/home-page.component'),
  },
  {
    path: '**',
    redirectTo: '',
  }
];
