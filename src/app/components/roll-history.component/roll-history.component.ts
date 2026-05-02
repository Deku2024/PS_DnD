import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RollHistoryService, RollHistoryEntry } from '../../services/roll-history.service';
import { TypeOfThrow } from '../../services/roll-dice.service';

@Component({
  selector: 'app-roll-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roll-history.component.html',
  styleUrl: './roll-history.component.css'
})
export class RollHistoryComponent implements OnInit, OnDestroy {
  @Input() isMaster: boolean = false;
  @Input() currentUserId: string = '';
  @Input() playerEmails: { [uid: string]: string } = {};

  isOpen: boolean = false;
  entries: RollHistoryEntry[] = [];
  private sub?: Subscription;

  constructor(private rollHistoryService: RollHistoryService) {}

  ngOnInit(): void {
    this.entries = this.rollHistoryService.getHistory(this.isMaster, this.currentUserId);
    this.sub = this.rollHistoryService.history$.subscribe(() => {
      this.entries = this.rollHistoryService.getHistory(this.isMaster, this.currentUserId);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.rollHistoryService.lastSeenCount = this.entries.length;
    }
  }

  close(): void {
    this.isOpen = false;
    this.rollHistoryService.lastSeenCount = this.entries.length;
  }

  get count(): number {
    return this.entries.length - this.rollHistoryService.lastSeenCount;
  }

  getThrowLabel(entry: RollHistoryEntry): string {
    const d = entry.data;
    const amount = d.amount > 1 ? `${d.amount}` : '';
    const bonus = d.bonus > 0 ? ` + ${d.bonus}` : d.bonus < 0 ? ` - ${Math.abs(d.bonus)}` : '';
    return `${amount}d${d.side}${bonus}`;
  }

  getTypeLabel(entry: RollHistoryEntry): string {
    switch (entry.data.type) {
      case TypeOfThrow.Advantage: return ' (ventaja)';
      case TypeOfThrow.Disadvantage: return ' (desventaja)';
      default: return '';
    }
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

  getResultClass(entry: RollHistoryEntry): string {
    if (entry.data.isNat20) return 'result-nat20';
    if (entry.data.isNat1) return 'result-nat1';
    return '';
  }

  getPlayerName(entry: RollHistoryEntry): string {
    return this.playerEmails[entry.userId] || entry.userName;
  }

  getTimeAgo(entry: RollHistoryEntry): string {
    if (!entry.timestamp) return 'ahora';
    const now = new Date();
    const then = entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
    const diffMs = now.getTime() - then.getTime();
    if (isNaN(diffMs) || diffMs < 60000) return 'ahora';
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMin < 60) {
      return diffMin === 1 ? 'hace 1 min' : `hace ${diffMin} min`;
    }
    if (diffHrs < 24) {
      return diffHrs === 1 ? 'hace 1 h' : `hace ${diffHrs} h`;
    }
    return diffDays === 1 ? 'hace 1 d' : `hace ${diffDays} d`;
  }
}
