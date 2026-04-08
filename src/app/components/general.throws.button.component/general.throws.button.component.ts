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
  public errorMessage = signal<string>('');

  public diceRoller = inject(DiceRollerService);

  public interactWithPanel():void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  public closeMenu():void {
    if (this.errorMessage() !== "") {
      return;
    }
    this.isMenuOpen.set(false);
  }

  public openMenu():void {
    this.isMenuOpen.set(true);
  }

  public throwCustom(dataThrow: string): void {

    if (!dataThrow || dataThrow.trim() === '') {
      this.errorMessage.set('Por favor, introduce una tirada válida (ej: 2d6+3)');
      return;
    }

    const isValidFormat = /^\d*d\d+(?:\s*[+-]\s*\d+)?$/i.test(dataThrow.trim());
    if (!isValidFormat) {
      this.errorMessage.set('Formato inválido. Usa el formato: 2d6+3, d20, 4d4-2, etc.');
      return;
    }

    this.errorMessage.set('');
    this.diceRoller.rollDiceOf(dataThrow, this.dc());
    this.closeMenu();
  }

  public clearError(): void {
    this.errorMessage.set('');
  }
}
