import {Component, inject, OnDestroy, OnInit, OutputRefSubscription, signal} from '@angular/core';
import {DiceRollerService, ThrowsResult, TypeOfThrow} from '../../services/roll-dice.service';

@Component({
  selector: 'result-frame',
  templateUrl: './result.throw.frame.component.html',
  styleUrl: './result.throw.frame.component.css',
  standalone: true
})
export class ResultThrowFrameComponent implements OnInit, OnDestroy {

  diceRoller = inject(DiceRollerService);
  result = signal<ThrowsResult | undefined>(undefined);
  showResult = signal<boolean>(false);

  private subscription: OutputRefSubscription | null = null;
  private timer: any = null;

  ngOnInit(): void {
    this.subscription = this.diceRoller.lastResult$.subscribe((result) => {
      this.showResult.set(true);
      this.result.set(result);

      if (this.timer !== null) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.showResult.set(false);
      }, 4000);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  interruptDisplay(): void {
    this.showResult.set(false);
  }

  protected readonly TypeOfThrow = TypeOfThrow;
}
