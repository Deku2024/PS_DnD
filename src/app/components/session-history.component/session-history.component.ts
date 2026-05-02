import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionHistoryService, SessionHistoryRecord } from '../../services/session-history.service';
import {RollHistoryComponent} from '../roll-history.component/roll-history.component';

@Component({
  selector: 'session-history',
  standalone: true,
  imports: [CommonModule, RollHistoryComponent],
  templateUrl: './session-history.component.html',
  styleUrl: './session-history.component.css'
})
export class SessionHistoryComponent implements OnInit {
  @Input() currentUserId: string = '';

  pastSessions: SessionHistoryRecord[] = [];
  loading: boolean = false;
  expandedSessionId: string | null = null;

  constructor(private sessionHistoryService: SessionHistoryService) {}

  ngOnInit(): void {
    console.log('Sesiones recuperadas:');
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      // Intenta traer TODO sin filtros solo para ver si el componente renderiza
      // (Solo si tienes el método getAll en tu servicio)
      const data = await this.sessionHistoryService.getHistoryByPlayer(this.currentUserId);
      console.log("Datos recibidos de Firebase:", data);
      this.pastSessions = data;
    } catch (e) {
      console.error("Error cargando:", e);
    } finally {
      this.loading = false;
    }
  }

  get count(): number {
    return this.pastSessions.length;
  }

  toggleSession(id: string): void {
    this.expandedSessionId = this.expandedSessionId === id ? null : id;
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}
