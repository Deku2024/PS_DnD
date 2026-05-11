import {ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { doc, onSnapshot, Unsubscribe, getFirestore } from 'firebase/firestore';

@Component({
  selector: 'app-session-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-test.component.html',
  styleUrl: './session-test.component.css'
})
export class SessionTestComponent implements OnInit, OnDestroy {
  sessionName = '';
  sessionPassword = '';
  joinCode = '';
  joinPassword = '';
  message = '';
  isError = false;

  currentUser: User | null = null;

  mySessions: Session[] = [];
  showMySessions = false;
  mySessionsLoading = false;

  authService = inject(AuthService);

  private authSub?: Subscription;
  private unsubscribeFirestore?: Unsubscribe;

  constructor(
    private sessionService: SessionService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    let loaded = false;
    this.authSub = this.authService.onAuthState().subscribe(user => {
      this.currentUser = user;
      if (user && !loaded) {
        loaded = true;
        this.loadMySessions();
      }
    });
  }

  watchSessionAccess(sessionId: string, userId: string) {
    const db = getFirestore();
    const docRef = doc(db, 'sessions', sessionId);

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    this.unsubscribeFirestore = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const players = data['players'] || [];

        if (!players.includes(userId)) {
          this.handleKickOut();
        }
      } else {
        this.handleKickOut();
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        this.handleKickOut();
      }
    });
  }

  private handleKickOut() {
    this.showMessage('Acceso revocado de la sesión.', true);
    this.router.navigate(['/login']);
  }

  async loadMySessions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.mySessionsLoading = true;
    this.cd.markForCheck();
    try {
      this.mySessions = await this.sessionService.getSessionsByPlayer(user.uid);
    } catch {
      this.mySessions = [];
    } finally {
      this.mySessionsLoading = false;
      this.cd.markForCheck();
    }
  }

  toggleMySessions() {
    this.showMySessions = !this.showMySessions;
  }

  enterSession(sessionId: string) {
    if (this.currentUser) {
      this.watchSessionAccess(sessionId, this.currentUser.uid);
    }
    this.router.navigate(['/choose-character'], { queryParams: { sessionId } });
  }

  async onCreate() {
    if (!this.currentUser) {
      this.showMessage('No hay usuario autenticado.', true);
      return;
    }
    if (!this.sessionName.trim() || !this.sessionPassword.trim()) {
      this.showMessage('Introduce nombre y contraseña.', true);
      return;
    }
    try {
      const id = await this.sessionService.createSession(
        this.sessionName,
        this.currentUser.uid,
        this.currentUser.email || this.currentUser.uid,
        this.sessionPassword
      );
      this.sessionService.setCurrentSessionId(id);
      this.watchSessionAccess(id, this.currentUser.uid);
      this.router.navigate(['/session', id]);
    } catch (e: any) {
      this.showMessage('Error: ' + e.message, true);
    }
  }

  async onJoin() {
    if (!this.currentUser) {
      this.showMessage('No hay usuario autenticado.', true);
      return;
    }
    if (!this.joinCode.trim() || !this.joinPassword.trim()) {
      this.showMessage('Introduce el código y la contraseña de la sesión.', true);
      return;
    }
    try {
      await this.sessionService.joinSession(
        this.joinCode,
        this.currentUser.uid,
        this.currentUser.email || this.currentUser.uid,
        this.joinPassword
      );
      const sessionId = this.sessionService.getCurrentSessionId();
      if (sessionId) {
        this.watchSessionAccess(sessionId, this.currentUser.uid);
      }
      this.router.navigate(['/choose-character'], { queryParams: { sessionId } });
    } catch (e: any) {
      this.showMessage('Error: ' + e.message, true);
    }
  }

  private showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
    this.cd.markForCheck();
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }
  }

  enterMonsterPage() {
    this.router.navigate(['/bestiary']);
  }


}
