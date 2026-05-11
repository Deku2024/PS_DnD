import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RollHistoryEntry } from '../../services/roll-history.service';
import { TypeOfThrow } from '../../services/roll-dice.service';

@Component({
  selector: 'app-roll-history-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roll-history.component.html',
  styleUrl: './roll-history.component.css'
})
export class RollHistoryComponent {
  @Input() entry!: RollHistoryEntry;
  @Input() compact: boolean = false;
  @Input() playerUsernames: { [uid: string]: string } = {};
  @Input() playerEmails: { [uid: string]: string } = {};
  @Input() showTime: boolean = true;

  getThrowLabel(): string {
    const d = this.entry.data;
    const amount = d.amount > 1 ? `${d.amount}` : '';
    const bonus = d.bonus > 0 ? ` + ${d.bonus}` : d.bonus < 0 ? ` - ${Math.abs(d.bonus)}` : '';
    return `${amount}d${d.side}${bonus}`;
  }

  getTypeLabel(): string {
    switch (this.entry.data.type) {
      case TypeOfThrow.Advantage: return ' (ventaja)';
      case TypeOfThrow.Disadvantage: return ' (desventaja)';
      default: return '';
    }
  }

  getStatusLabel(): string {
    if (this.entry.data.isNat20) return 'crítico';
    if (this.entry.data.isNat1) return 'pifia';
    if (this.entry.data.dc > 0) return this.entry.data.success ? 'éxito' : 'fallo';
    return '';
  }

  getStatusClass(): string {
    if (this.entry.data.isNat20) return 'status-nat20';
    if (this.entry.data.isNat1) return 'status-nat1';
    if (this.entry.data.dc > 0) return this.entry.data.success ? 'status-success' : 'status-fail';
    return '';
  }

  getResultClass(): string {
    if (this.entry.data.isNat20) return 'result-nat20';
    if (this.entry.data.isNat1) return 'result-nat1';
    return '';
  }

  getPlayerName(): string {
    if (this.playerUsernames?.[this.entry.userId]) return this.playerUsernames[this.entry.userId];
    if (this.entry.userName && !this.entry.userName.includes('@')) return this.entry.userName;
    return this.playerEmails[this.entry.userId] || this.entry.userName;
  }

  getTimeAgo(): string {
    if (!this.entry.timestamp) return 'ahora';
    const now = new Date();
    const then = this.entry.timestamp.toDate ? this.entry.timestamp.toDate() : new Date(this.entry.timestamp);
    const diffMs = now.getTime() - then.getTime();
    if (isNaN(diffMs) || diffMs < 60000) return 'ahora';
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMin < 60) return diffMin === 1 ? 'hace 1 min' : `hace ${diffMin} min`;
    if (diffHrs < 24) return diffHrs === 1 ? 'hace 1 h' : `hace ${diffHrs} h`;
    return diffDays === 1 ? 'hace 1 d' : `hace ${diffDays} d`;
  }
}
