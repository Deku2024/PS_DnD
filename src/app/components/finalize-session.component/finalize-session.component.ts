import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionHistoryService } from '../../services/session-history.service';
import { RollHistoryService } from '../../services/roll-history.service';
import { CharacterService } from '../../services/character.service';

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
    private rollHistoryService: RollHistoryService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const sessionNumber = this.pastSessionCount + 1;
    const monthNames = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const monthName = monthNames[now.getMonth()];
    this.finalizeSessionName = `Sesión ${sessionNumber} (${now.getDate()} ${monthName} ${now.getFullYear()})`;
  }

  async confirm(): Promise<void> {
    if (this.finalizing) return;
    this.finalizing = true;

    try {
      const allRolls = this.rollHistoryService.getHistory(true, '');
      const playerSnapshots: { [uid: string]: any } = {};
      const realPlayers = this.players.filter(uid => uid !== this.masterId);

      await Promise.all(
        realPlayers.map(async (uid) => {
          try {
            const characters = await this.characterService.listCharactersByUserAndSession(uid, this.sessionId);

            if (characters && characters.length > 0) {
              playerSnapshots[uid] = characters[0];
            }
          } catch (err) {
            console.error(`Error capturando ficha para ${uid}:`, err);
          }
        })
      );

      const allParticipants = Array.from(new Set([...this.players, this.masterId])).filter(id => !!id);

      await this.sessionHistoryService.saveSessionHistory({
        sessionId: this.sessionId,
        sessionName: this.finalizeSessionName || `Sesión (${new Date().toLocaleDateString()})`,
        description: this.finalizeDescription,
        masterId: this.masterId,
        masterName: this.masterName,
        players: allParticipants,
        playerUsernames: this.playerUsernames,
        playerSnapshots: playerSnapshots,
        rollCount: allRolls.length,
        rolls: allRolls
      });

      await this.rollHistoryService.saveAndClear();
      try {
        await this.rollHistoryService.deleteSessionRolls(this.sessionId);
      } catch (e) {
        console.warn('No se pudieron borrar los rolls de Firestore:', e);
      }

      this.finalized.emit();
    } catch (e) {
      console.error('Error al finalizar sesión:', e);
    } finally {
      this.finalizing = false;
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
