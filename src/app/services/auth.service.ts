import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, User, updateProfile } from 'firebase/auth';
import { Observable } from 'rxjs';
import {collection, Firestore, getDocs, query, where} from 'firebase/firestore';
import firebase from 'firebase/compat/app';
import UserCredential = firebase.auth.UserCredential;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly collectionName = 'usernames';

  constructor(private firebase: FirebaseService) {}

  signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebase.auth, email, password);
  }

  async signUpWithEmail(email: string, password: string, username: string) {
    let userCredential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
    await this.setUsernameToCurrentUser(username);
    return userCredential;
  }

  getCurrentUser(): User | null {
    return this.firebase.auth.currentUser;
  }

  sendEmailVerification() {
    const user = this.firebase.auth.currentUser;
    if (!user) return Promise.reject(new Error('No user logged in'));
    return sendEmailVerification(user);
  }

  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.firebase.auth, email);
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

  getCurrentUsername(): string {
    return this.getCurrentUser()?.displayName || '';
  }

  async setUsernameToCurrentUser(username: string) : Promise<void> {
    let currentUser = this.getCurrentUser();
    if (currentUser === null) return;
    await updateProfile(currentUser, {displayName: username});
  }

  /**
   * Map Firebase Auth errors to friendly messages for the UI.
   */
  friendlyErrorMessage(err: any): string {
    if (!err) return 'Unknown error. Please try again.';
    const code: string = err.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ese correo ya está registrado. Inicia sesión o utiliza otro correo.';
      case 'auth/invalid-email':
        return 'La dirección de correo no es válida.';
      case 'auth/operation-not-allowed':
        return 'Operación no permitida. Contacta con soporte.';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';
      case 'auth/missing-email':
        return 'Por favor, introduce un correo electrónico.';
      case 'auth/user-disabled':
        return 'La cuenta ha sido deshabilitada. Contacta con soporte.';
      case 'auth/user-not-found':
        return 'No existe una cuenta con ese correo.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta. Intenta de nuevo.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
      case 'auth/network-request-failed':
        return 'Error de red. Revisa tu conexión e inténtalo de nuevo.';
      default:
        // fallback to message if provided, otherwise generic (Spanish)
        return err.message || 'Error de autenticación. Intenta de nuevo.';
    }
  }
}
