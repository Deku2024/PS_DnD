import {Component, inject, input, InputSignal, output, signal} from '@angular/core';
import {DiceRollerService, ThrowsResult} from '../../services/roll-dice.service';

@Component({
  selector: 'd20-roller',
  templateUrl: './d20.roller.button.component.html',
  standalone: true
})
export class D20RollerButtonComponent {

  bonus: InputSignal<number> = input<number>(0);
  dc: InputSignal<number> = input<number>(-1);
  diceRoller = inject(DiceRollerService);

  public roll() : void {
    this.diceRoller.rollAD20(this.bonus(), this.dc());
  }


}
