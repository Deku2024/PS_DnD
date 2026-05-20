import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../services/sessions.service';
import { RollHistoryService } from '../../services/roll-history.service';

@Component({
  selector: 'app-dm-floating-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dm-floating-menu.component.html',
  styleUrls: ['./dm-floating-menu.component.css']
})
export class DmFloatingMenuComponent {
  @Input() sessionId: string = '';
  @Input() isBattleActive: boolean = false;
  @Input() showLocalActions: boolean = true;

  @Output() mapClick = new EventEmitter<void>();
  @Output() historyClick = new EventEmitter<void>();

  showMenu = false;

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private rollHistoryService: RollHistoryService
  ) {}

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  async leave(): Promise<void> {
    await this.rollHistoryService.saveAndClear();
    this.sessionService.setCurrentSessionId(null);
    this.router.navigate(['/home']);
  }

  // 🟢 NUEVO: Te devuelve a la vista general de la partida
  goToMainSession(): void {
    if (!this.sessionId) return;
    this.sessionService.setCurrentSessionId(this.sessionId);
    this.router.navigate(['/session', this.sessionId]);
    this.showMenu = false;
  }

  goToNotes(): void {
    if (!this.sessionId) return;
    this.sessionService.setCurrentSessionId(this.sessionId);
    this.router.navigate(['/dm-notes'], { queryParams: { sessionId: this.sessionId } });
    this.showMenu = false;
  }

  async goToCombat(): Promise<void> {
    if (!this.sessionId) return;
    if (!this.isBattleActive) {
      await this.sessionService.updateStatus(this.sessionId, 'in-battle');
    }
    this.router.navigate(['/session', this.sessionId, 'dm-combat']);
    this.showMenu = false;
  }

  onHistory(): void {
    this.historyClick.emit();
    this.showMenu = false;
  }

  onMap(): void {
    this.mapClick.emit();
    this.showMenu = false;
  }
}
