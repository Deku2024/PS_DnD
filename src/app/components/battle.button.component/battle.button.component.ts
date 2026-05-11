import {CommonModule} from '@angular/common';
import {Component, Input, inject} from '@angular/core';
import {BattleService} from '../../services/battle.service';
import {Router} from '@angular/router';
import {SessionService} from '../../services/sessions.service';

@Component({
  selector: 'battle-button-component',
  imports: [CommonModule],
  templateUrl: './battle.button.component.html',
  styleUrl: './battle.button.component.css',
  standalone: true,
})
export class BattleButtonComponent {
  @Input() hasActiveBattle = false;

  showConfirmModal = false;
  combatService = inject(BattleService);

  constructor(private router: Router, private sessionService: SessionService) {}

  async startBattle(): Promise<void> {
    if (this.hasActiveBattle) {
      this.showConfirmModal = true;
      return;
    }

    await this.confirmStartBattle();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  async confirmStartBattle(): Promise<void> {
    const sessionId = this.sessionService.getCurrentSessionId();
    if (!sessionId) return;
    this.showConfirmModal = false;
    if (this.hasActiveBattle) {
      await this.sessionService.updateCombatOrder(sessionId, []);
    }
    this.combatService.status = 'preparing';
    await this.sessionService.updateStatus(sessionId, 'in-battle');
    this.router.navigate(['/session', sessionId, 'dm-combat']);
  }
}
