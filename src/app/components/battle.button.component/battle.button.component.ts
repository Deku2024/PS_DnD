import {Component, inject} from '@angular/core';
import {BattleService} from '../../services/battle.service';
import {Router} from '@angular/router';

@Component({
  selector: 'battle-button-component',
  imports: [],
  templateUrl: './battle.button.component.html',
  styleUrl: './battle.button.component.css',
  standalone: true,
})
export class BattleButtonComponent {
  combatService = inject(BattleService);

  constructor(private router : Router) {}

  startBattle(): void {
    this.combatService.status = 'preparing';
    this.combatService.startPreparingCombat();
    this.router.navigate(['/dm-combat']);
  }

}
