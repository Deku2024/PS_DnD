import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { SessionTestComponent } from './pages/session-test/session-test.component'; // ← añadir

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth').then(m => m.Auth),
    canActivate: [GuestGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
    canActivate: [AuthGuard]
  },
  { path: 'test', component: SessionTestComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
