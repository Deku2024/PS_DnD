import {Component, inject} from '@angular/core';
import {BattleService} from '../../services/battle.service';
import {Router} from '@angular/router';
import {SessionService} from '../../services/sessions.service';

@Component({
  selector: 'battle-button-component',
  imports: [],
  templateUrl: './battle.button.component.html',
  styleUrl: './battle.button.component.css',
  standalone: true,
})
export class BattleButtonComponent {
  combatService = inject(BattleService);

  constructor(private router: Router, private sessionService: SessionService) {}

  startBattle(): void {
    const sessionId = this.sessionService.getCurrentSessionId();
    if (!sessionId) return;
    this.combatService.status = 'preparing';
    this.router.navigate(['/session', sessionId, 'dm-combat']);
  }

}
