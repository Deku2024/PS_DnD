import {Component, inject, input, signal} from '@angular/core';
import {
  SingleCustomThrowButtonComponent
} from '../single.custom.throw.button.component/single.custom.throw.button.component';
import {DiceRollerService} from '../../services/roll-dice.service';

@Component({
  selector: 'general-throw-component',
  imports: [
    SingleCustomThrowButtonComponent
  ],
  templateUrl: './general.throws.button.component.html',
  styleUrl: './general.throws.button.component.css',
  standalone: true
})
export class GeneralThrowsButtonComponent {
  public isMenuOpen = signal(false);
  public dc = input<number>(-1);

  public diceRoller = inject(DiceRollerService);

  public interactWithPanel():void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  public closeMenu():void {
    this.isMenuOpen.set(false);
  }

  public openMenu():void {
    this.isMenuOpen.set(true);
  }

  public throwCustom(dataThrow: string): void {
    this.diceRoller.rollDiceOf(dataThrow)
  }
}
