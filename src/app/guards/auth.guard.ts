import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private firebase: FirebaseService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return new Observable(subscriber => {
      const unsub = onAuthStateChanged(this.firebase.auth, user => {
        if (user) subscriber.next(true);
        else subscriber.next(this.router.createUrlTree(['/auth']));
        subscriber.complete();
      });
      return () => unsub();
    });
  }
}
