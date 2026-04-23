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
  inAnimation = signal<boolean>(false);
  showResult = signal<boolean>(false);
  showBounce = signal<boolean>(false);
  stopChangingNumber = signal<boolean>(false);
  currentNumber = signal<number>(0);
  delay = signal<number>(10);

  private subscription: OutputRefSubscription | null = null;

  private showResultTimer: any = null;
  private animationTimer: any = null;
  private numberInterval: any = null;
  private holdInterval: any = null;

  ngOnInit(): void {
    this.subscription = this.diceRoller.lastResult$.subscribe((result) => {

      this.inAnimation.set(true);
      this.stopChangingNumber.set(false);
      this.result.set(result);
      this.clearTimers();
      this.delay.set(10);
      this.changeNumber();

      this.animationTimer = setTimeout(() => {
        this.stopAnimation();

        this.showResultTimer = setTimeout(() => {
          this.showResult.set(false);
        }, 4000);
      }, 5000);

    });
  }

  private stopAnimation() {

    if (this.numberInterval !== null) {
      clearTimeout(this.numberInterval);
      this.numberInterval = null;
    }

    this.currentNumber.set(<number>this.result()?.result);

    this.holdInterval = setTimeout(() => {

      this.stopChangingNumber.set(true);
      this.inAnimation.set(false);
      this.showResult.set(true);
    }, 2000);
  }

  private clearTimers() {
    if (this.animationTimer !== null) {
      clearTimeout(this.animationTimer);
    }

    if (this.numberInterval !== null) {
      clearTimeout(this.numberInterval);
    }

    if (this.showResultTimer !== null) {
      clearTimeout(this.showResultTimer);
    }

    if (this.holdInterval !== null) {
      clearTimeout(this.holdInterval);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  interruptDisplay(): void {
    if (this.inAnimation()) {

      this.clearTimers();
      this.inAnimation.set(false);
      this.stopChangingNumber.set(false);
      this.currentNumber.set(<number>this.result()?.result);
      this.showResult.set(true);

    } else if (this.stopChangingNumber()) {

      this.clearTimers();
      this.stopChangingNumber.set(false);
      this.showResult.set(true);

    } else {
      this.showResult.set(false);
    }
  }

  private changeNumber(): void {

    if (this.stopChangingNumber()) return;

    this.currentNumber.set(Math.floor(Math.random() * this.result()?.side!) + 1);
    this.delay.set(Math.min(this.delay() * 1.15, 300))

    this.numberInterval = setTimeout(() => {
      this.changeNumber();
        }, this.delay()
    );
  }


  protected readonly TypeOfThrow = TypeOfThrow;
}
