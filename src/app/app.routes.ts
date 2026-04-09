import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { SessionTestComponent } from './pages/session-test/session-test.component'; // ← añadir
import { Auth } from './pages/auth/auth';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth').then((m) => m.Auth),
    canActivate: [GuestGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    canActivate: [AuthGuard],
  },
  {
    path: 'player-sheet',
    loadComponent: () => import('./pages/player-sheet/player-sheet').then((m) => m.PlayerSheet),
    canActivate: [AuthGuard],
  },
  {
		path: 'dm-notes',
		loadComponent: () => import('./pages/dm-notes/dm-notes').then(m => m.DmNotes),
		// canActivate: [GuestGuard]
	},
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

