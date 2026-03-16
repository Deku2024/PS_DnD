import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private firebase: FirebaseService) {}

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebase.auth, email, password);
  }

  signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.firebase.auth, email, password);
  }

  signOut() {
    return signOut(this.firebase.auth);
  }

  onAuthState(): Observable<User | null> {
    return new Observable(sub => {
      const unsub = onAuthStateChanged(this.firebase.auth, user => {
        sub.next(user);
      });
      return () => unsub();
    });
  }

  isAuthenticated(): Observable<boolean> {
    return new Observable(sub => {
      const unsub = onAuthStateChanged(this.firebase.auth, user => {
        sub.next(!!user);
      });
      return () => unsub();
    });
  }
}
