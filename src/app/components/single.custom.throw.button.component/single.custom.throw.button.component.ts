import {Component, inject, input, output} from '@angular/core';
import {DiceRollerService} from '../../services/roll-dice.service';
import firebase from 'firebase/compat/app';
import functions = firebase.functions;

@Component({
  selector: 'single-custom-throw-button',
  templateUrl: './single.custom.throw.button.component.html',
  standalone: true
})
export class SingleCustomThrowButtonComponent {

  public diceRoller = inject(DiceRollerService);
  public dataThrow = input.required<string>(); // '4d4 + 4' por ejemplo
  public dc = input<number>(-1);
  public callback = output<void>();

  roll() {
    this.diceRoller.rollDiceOf(this.dataThrow(), this.dc());
    this.callback.emit();
  }
}
