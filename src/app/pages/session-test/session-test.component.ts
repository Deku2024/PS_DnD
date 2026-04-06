import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // <-- 1. Importamos el Router
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

  // UID de prueba (Ojo: Para el futuro, esto debería venir del AuthService)
  fakeUserId = 'user_' + Math.random().toString(36).slice(2, 7);

  constructor(
    private sessionService: SessionService,
    private router: Router // <-- 2. Inyectamos el Router
  ) {}

  async onCreate() {
    if (!this.sessionName.trim()) return;
    try {
      const id = await this.sessionService.createSession(this.sessionName, this.fakeUserId);
      this.sessionId = id;
      this.message = `Sesión creada con ID: ${id}`;

      // 3. ¡Teletransporte al panel del DM!
      this.router.navigate(['/dm-notes', id]);
    } catch (e: any) {
      this.message = 'Error: ' + e.message;
    }
  }

  async onJoin() {
    if (!this.joinId.trim()) return;
    try {
      await this.sessionService.joinSession(this.joinId, this.fakeUserId);
      this.message = `Te uniste a la sesión ${this.joinId}`;

      // 4. ¡Teletransporte a la ficha del jugador!
      this.router.navigate(['/player-sheet', this.joinId]);
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
