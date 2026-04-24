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
    loadComponent: () => import('./pages/session-test/session-test.component').then((m) => m.SessionTestComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'player-sheet',
    loadComponent: () => import('./pages/player-sheet/player-sheet').then((m) => m.PlayerSheet),
    canActivate: [AuthGuard],
  },
  {
    path: 'monster-sheet',
    loadComponent: () => import('./pages/monster-sheet/monster-sheet').then((m) => m.MonsterSheet),
    canActivate: [AuthGuard],
  },
  {
    path: 'choose-character',
    loadComponent: () => import('./pages/choose-character/choose-character').then((m) => m.ChooseCharacter),
    canActivate: [AuthGuard],
  },
  {
    path: 'session/:id',
    loadComponent: () => import('./pages/session/session').then((m) => m.SessionPage),
    canActivate: [AuthGuard],
  },
  {
		path: 'dm-notes',
		loadComponent: () => import('./pages/dm-notes/dm-notes').then(m => m.DmNotes),
		canActivate: [AuthGuard],
	},

  {
    path: 'sessions',
    loadComponent: () => import('./pages/session-test/session-test.component').then(m => m.SessionTestComponent),
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

