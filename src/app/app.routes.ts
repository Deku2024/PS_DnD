import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

export const routes: Routes = [
	{
		path: 'auth',
		loadComponent: () => import('./pages/auth/auth').then(m => m.Auth),
		canActivate: [GuestGuard]
	},
	{
		path: 'home',
		loadComponent: () => import('./pages/player-sheet/player-sheet').then(m => m.PlayerSheet),
		canActivate: [GuestGuard]
	},
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: '**', redirectTo: 'home' }
];
