import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, Session } from '../../services/sessions.service';

@Component({
  selector: 'app-session-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-test.component.html',
  styleUrl: './session-test.component.css'
})
export class SessionTestComponent implements OnDestroy {
  sessionName = '';
  sessionPassword = '';
  sessionId = '';
  joinId = '';
  joinPassword = '';
  currentSession: Session | null = null;
  message = '';
  isError = false;

  private unsubscribe?: () => void;

  fakeUserId = 'user_' + Math.random().toString(36).slice(2, 7);

  constructor(private sessionService: SessionService) {}

  async onCreate() {
    if (!this.sessionName.trim() || !this.sessionPassword.trim()) {
      this.showMessage('Introduce nombre y contraseña.', true);
      return;
    }
    try {
      const id = await this.sessionService.createSession(this.sessionName, this.fakeUserId, this.sessionPassword);
      this.sessionId = id;
      this.showMessage(`Sesión creada con ID: ${id}`, false);
      this.listenTo(id);
    } catch (e: any) {
      this.showMessage('Error: ' + e.message, true);
    }
  }

  async onJoin() {
    if (!this.joinId.trim() || !this.joinPassword.trim()) {
      this.showMessage('Introduce el ID y la contraseña de la sesión.', true);
      return;
    }
    try {
      await this.sessionService.joinSession(this.joinId, this.fakeUserId, this.joinPassword);
      this.showMessage(`Te uniste a la sesión ${this.joinId}`, false);
      this.listenTo(this.joinId);
    } catch (e: any) {
      this.showMessage('Error: ' + e.message, true);
    }
  }

  private listenTo(id: string) {
    this.unsubscribe?.();
    this.unsubscribe = this.sessionService.listenSession(id, (session) => {
      this.currentSession = session;
    });
  }

  private showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
