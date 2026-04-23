import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';

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
  currentSession: Session | null = null;
  message = '';
  isError = false;

  currentUser: User | null = null;

  private unsubscribe?: () => void;
  private authSub?: Subscription;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.authSub = this.authService.onAuthState().subscribe(user => {
      this.currentUser = user;
    });
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
      const code = await this.sessionService.createSession(
        this.sessionName,
        this.currentUser.uid,
        this.currentUser.email || this.currentUser.uid,
        this.sessionPassword
      );
      this.sessionService.setCurrentSessionId(code);
      this.showMessage(`Sesión creada — Código: ${code}`, false);
      this.listenTo(code);
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
      this.sessionService.setCurrentSessionId(this.joinCode);
      this.showMessage(`Te uniste a la sesión ${this.joinCode}`, false);
      this.listenTo(this.joinCode);
    } catch (e: any) {
      this.showMessage('Error: ' + e.message, true);
    }
  }

  private listenTo(code: string) {
    this.unsubscribe?.();
    this.unsubscribe = this.sessionService.listenSessionByCode(code, (session) => {
      this.currentSession = session;
    });
  }

  private showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
  }

  ngOnDestroy() {
    this.unsubscribe?.();
    this.authSub?.unsubscribe();
  }
}
