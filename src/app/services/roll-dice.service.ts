import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

interface Throws {
  maxValue: number;
  amount: number;
}

export interface ThrowsResult {
  result: number;
  throws: number[];
  bonus: number;
  type: TypeOfThrow;
  isNat20: boolean;
  isNat1: boolean;
  success: boolean;
  dc: number;
  side: number;
  amount: number;
}

export enum TypeOfThrow {
  Normal,
  Advantage,
  Disadvantage
}


@Injectable({ providedIn: 'root' })
export class DiceRollerService {

  private lastResultSubject = new Subject<ThrowsResult>();
  lastResult$ = this.lastResultSubject.asObservable();

  private type: TypeOfThrow = TypeOfThrow.Normal;

  public rollDiceOf(throws: string, dc?: number): void {
    const data = throws.split('d'); // formato esperado '4d6 + 4' (el bonus de manera opcional)

    let amount: number;

    if (data[0] === "") {
      amount = 1;
    } else {
      amount = parseInt(data[0]);
    }

    const { side, bonus } = this.extractBonus(data);

    if (isNaN(amount) || isNaN(side)) {
      throw new Error('Los dados pasados no son válidos, se esperan números');
    }

    let result = this.initializeResult(bonus, side, amount, dc ?? -1);
    result = this.roll(this.buildThrows(amount, side), dc ?? -1, result);

    this.lastResultSubject.next(result);
  }

  public rollAD20(bonus?: number, dc?: number): void {
    let throwsResult = this.initializeResult(bonus ?? 0, 20, 1, dc ?? -1);
    throwsResult = this.roll(this.buildThrows(1, 20), dc ?? -1, throwsResult);

    this.isCritic(throwsResult);
    this.lastResultSubject.next(throwsResult);
    console.log(throwsResult)
  }

  private isCritic(throwsResult: ThrowsResult): void {
    if (throwsResult.amount <= 1 || throwsResult.side !== 20) {
      return;
    }

    if (throwsResult.result - throwsResult.bonus == 20) {
      throwsResult.isNat20 = true;
    } else if (throwsResult.result - throwsResult.bonus == 1) {
      throwsResult.isNat1 = true;
    }
  }

  private extractBonus(data: string[]): { side: number; bonus: number } {
    if (data[1].includes("+")) {
      return this.getPositiveBonus(data);
    } else if (data[1].includes("-")) {
      return this.getNegativeBonus(data);
    }
    return {side: parseInt(data[1]), bonus: 0};
  }

  private getPositiveBonus(data: string[]): { side: number; bonus: number } {
    const additionalData = data[1].split("+");
    return {side: parseInt(additionalData[0]), bonus: parseInt(additionalData[1])};
  }

  private getNegativeBonus(data: string[]): { side: number; bonus: number } {
    let additionalData = data[1].split("-");
    return {side: parseInt(additionalData[0]), bonus: -parseInt(additionalData[1])};
  }

  private buildThrows(amount: number, side: number): Throws {
    return {
      amount: amount,
      maxValue: side
    };
  }

  private initializeResult(bonus: number, side: number, amount: number, dc: number): ThrowsResult {
    return {
      result: 0,
      throws: [],
      bonus: bonus,
      type: this.type,
      isNat20: false,
      isNat1: false,
      success: false,
      dc: dc,
      side: side,
      amount: amount
    };
  }

  private roll(throws: Throws, dc: number, throwsResult: ThrowsResult): ThrowsResult {
    let total = 0;

    for (let i = 0; i < throws.amount; i ++) {
      let oneRollResult = this.rollWith(throws.maxValue);
      total += oneRollResult;
      throwsResult.throws.push(oneRollResult);
    }

    console.log(total)
    throwsResult.result =  total + throwsResult.bonus;

    if (throwsResult.result >= dc) {
      throwsResult.success = true;
    }

    return throwsResult;
  }

  private rollWith(maxValue: number): number {
    const roll = () => Math.floor(Math.random() * maxValue) + 1;

    switch (this.type) {
      case TypeOfThrow.Normal:
        return roll();

      case TypeOfThrow.Advantage:
        return Math.max(roll(), roll());

      case TypeOfThrow.Disadvantage:
        return Math.min(roll(), roll());
    }
  }
}

