import {Component, inject} from '@angular/core';
import {BattleService} from '../../services/battle.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-battle.button.component',
  imports: [],
  templateUrl: './battle.button.component.html',
  styleUrl: './battle.button.component.css',
})
export class BattleButtonComponent {
  combatService = inject(BattleService);

  constructor(private router : Router) {}

  startBattle(): void {
    this.combatService.status = 'preparing';
    this.router.navigate(['/dm-combat']);
  }

}
