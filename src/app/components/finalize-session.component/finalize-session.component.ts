import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionHistoryService } from '../../services/session-history.service';
import { RollHistoryService } from '../../services/roll-history.service';

@Component({
  selector: 'finalize-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalize-session.component.html',
  styleUrl: './finalize-session.component.css'
})
export class FinalizeSessionComponent implements OnInit {
  @Input() sessionId: string = '';
  @Input() sessionName: string = '';
  @Input() masterId: string = '';
  @Input() masterName: string = '';
  @Input() players: string[] = [];
  @Input() playerUsernames: { [uid: string]: string } = {};
  @Input() pastSessionCount: number = 0;

  @Output() finalized = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  finalizeSessionName: string = '';
  finalizeDescription: string = '';
  finalizing: boolean = false;

  constructor(
    private sessionHistoryService: SessionHistoryService,
    private rollHistoryService: RollHistoryService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const sessionNumber = this.pastSessionCount + 1;
    const monthName = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][now.getMonth()];
    this.finalizeSessionName = `Sesión ${sessionNumber} (${now.getDate()} ${monthName} ${now.getFullYear()})`;
  }

  async confirm(): Promise<void> {
    if (this.finalizing) return;
    this.finalizing = true;
    try {
      const allRolls = this.rollHistoryService.getHistory(true, '');

      const allParticipants = [...this.players];
      if (this.masterId && !allParticipants.includes(this.masterId)) {
        allParticipants.push(this.masterId);
      }

      await this.sessionHistoryService.saveSessionHistory({
        sessionId: this.sessionId,
        sessionName: this.finalizeSessionName || `Sesión (${new Date().toLocaleDateString()})`,
        description: this.finalizeDescription,
        masterId: this.masterId,
        masterName: this.masterName,
        players: allParticipants,
        playerUsernames: this.playerUsernames,
        rollCount: allRolls.length,
        rolls: allRolls
      });

      await this.rollHistoryService.saveAndClear();
      await this.rollHistoryService.deleteSessionRolls(this.sessionId);
    } finally {
      this.finalizing = false;
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
