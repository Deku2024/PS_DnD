import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, Session } from '../../services/sessions.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-session-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-test.component.html',
  styleUrl: './session-test.component.css'
})
export class SessionTestComponent implements OnDestroy {
  sessionName = '';
  sessionId = '';
  joinId = '';
  currentSession: Session | null = null;
  message = '';

  unsubscribe?: () => void;

  // UID de prueba hardcodeado (sin auth real)
  fakeUserId = 'user_' + Math.random().toString(36).slice(2, 7);

  constructor(private sessionService: SessionService) {}

  async onCreate() {
    if (!this.sessionName.trim()) return;
    try {
      const id = await this.sessionService.createSession(this.sessionName, this.fakeUserId);
      this.sessionId = id;
      this.message = `Sesión creada con ID: ${id}`;
      this.listenTo(id);
    } catch (e: any) {
      this.message = 'Error: ' + e.message;
    }
  }

  async onJoin() {
    if (!this.joinId.trim()) return;
    try {
      await this.sessionService.joinSession(this.joinId, this.fakeUserId);
      this.message = `Te uniste a la sesión ${this.joinId}`;
      this.listenTo(this.joinId);
    } catch (e: any) {
      this.message = 'Error: ' + e.message;
    }
  }

  listenTo(id: string) {
    this.unsubscribe?.();
    this.unsubscribe = this.sessionService.listenSession(id, (session) => {
      this.currentSession = session;
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
