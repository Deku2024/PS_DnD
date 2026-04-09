import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return new Observable(subscriber => {
      const sub = this.auth.onAuthState().subscribe(user => {
        if (user) subscriber.next(true);
        else subscriber.next(this.router.createUrlTree(['/auth']));
        subscriber.complete();
        sub.unsubscribe();
      });
    });
  }
}
