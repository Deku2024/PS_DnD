import {Injectable} from '@angular/core';
import {FirebaseService} from './firebase.service';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import {Observable} from 'rxjs';
import {UsernameService} from './username.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private firebase: FirebaseService, private usernameService: UsernameService) {}

  signIn(input: string, password: string) {
    if (input.includes('@')) {
      return this.signInWithEmail(input, password);
    }
    return this.signInWithUsername(input, password);
  }

  signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebase.auth, email, password);
  }

  async signInWithUsername(username: string, password: string) {
    return signInWithEmailAndPassword(this.firebase.auth, await this.usernameService.getEmailFromUsername(username), password);
  }

  async signUp(email: string, password: string, username: string) {
    let userCredential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
    await this.setUsernameToCurrentUser(username);
    await this.usernameService.addRelation(email, username);
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
