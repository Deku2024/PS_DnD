import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionHistoryService, SessionHistoryRecord } from '../../services/session-history.service';
import { RollHistoryEntry } from '../../services/roll-history.service';

@Component({
  selector: 'session-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-history.component.html',
  styleUrl: './session-history.component.css'
})
export class SessionHistoryComponent implements OnInit {
  @Input() currentUserId: string = '';
  @Input() sessionId: string = '';

  pastSessions: SessionHistoryRecord[] = [];
  loading: boolean = false;
  expandedSessionId: string | null = null;
  expandedPlayerId: { [sessionId: string]: string | null } = {};

  constructor(private sessionHistoryService: SessionHistoryService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.pastSessions = await this.sessionHistoryService.getHistoryByPlayer(this.currentUserId);
    } catch (e) {
      console.error('Error cargando:', e);
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

  togglePlayer(sessionId: string, uid: string): void {
    const current = this.expandedPlayerId[sessionId];
    this.expandedPlayerId[sessionId] = current === uid ? null : uid;
  }

  getPlayersInSession(s: SessionHistoryRecord): string[] {
    return s.players;
  }

  getPlayerInitial(uid: string, s: SessionHistoryRecord): string {
    const name = s.playerUsernames?.[uid] || uid;
    return name.charAt(0).toUpperCase();
  }

  getPlayerName(uid: string, s: SessionHistoryRecord): string {
    return s.playerUsernames?.[uid] || uid;
  }

  getRollsForPlayer(uid: string, s: SessionHistoryRecord): RollHistoryEntry[] {
    if (!s.rolls) return [];
    return s.rolls.filter(r => r.userId === uid).reverse();
  }

  getRollCountForPlayer(uid: string, s: SessionHistoryRecord): number {
    return this.getRollsForPlayer(uid, s).length;
  }

  getCriticsForPlayer(uid: string, s: SessionHistoryRecord): number {
    return this.getRollsForPlayer(uid, s).filter(r => r.data.isNat20).length;
  }

  getPifiasForPlayer(uid: string, s: SessionHistoryRecord): number {
    return this.getRollsForPlayer(uid, s).filter(r => r.data.isNat1).length;
  }

  getResultClass(entry: RollHistoryEntry): string {
    if (entry.data.isNat20) return 'result-nat20';
    if (entry.data.isNat1) return 'result-nat1';
    return '';
  }

  getThrowLabel(entry: RollHistoryEntry): string {
    const d = entry.data;
    const amount = d.amount > 1 ? `${d.amount}` : '';
    const bonus = d.bonus > 0 ? ` + ${d.bonus}` : d.bonus < 0 ? ` - ${Math.abs(d.bonus)}` : '';
    return `${amount}d${d.side}${bonus}`;
  }

  getStatusLabel(entry: RollHistoryEntry): string {
    if (entry.data.isNat20) return 'crítico';
    if (entry.data.isNat1) return 'pifia';
    if (entry.data.dc > 0) return entry.data.success ? 'éxito' : 'fallo';
    return '';
  }

  getStatusClass(entry: RollHistoryEntry): string {
    if (entry.data.isNat20) return 'status-nat20';
    if (entry.data.isNat1) return 'status-nat1';
    if (entry.data.dc > 0) return entry.data.success ? 'status-success' : 'status-fail';
    return '';
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}
