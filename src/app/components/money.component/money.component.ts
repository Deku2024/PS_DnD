import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'money-section',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './money.component.html',
  styleUrl: './money.component.css'
})
export class MoneyComponent {
  moneyGroup = input.required<FormGroup>();

  private readonly rates: Record<string, number> = {
    ppt: 10,
    po:  1,
    pe:  0.5,
    pp:  0.1,
    pc:  0.01
  };

  readonly coinList = [
    { name: 'ppt', label: 'Platino' },
    { name: 'po',  label: 'Oro' },
    { name: 'pe',  label: 'Electro' },
    { name: 'pp',  label: 'Plata' },
    { name: 'pc',  label: 'Cobre' }
  ];

  readonly conversions = [
    { from: 'pc',  to: 'pp',  label: '10 pc → 1 pp',  cost: 10, gain: 1 },
    { from: 'pp',  to: 'pc',  label: '1 pp → 10 pc',  cost: 1,  gain: 10 },
    { from: 'pp',  to: 'pe',  label: '5 pp → 1 pe',   cost: 5,  gain: 1 },
    { from: 'pe',  to: 'pp',  label: '1 pe → 5 pp',   cost: 1,  gain: 5 },
    { from: 'pe',  to: 'po',  label: '2 pe → 1 po',   cost: 2,  gain: 1 },
    { from: 'po',  to: 'pe',  label: '1 po → 2 pe',   cost: 1,  gain: 2 },
    { from: 'po',  to: 'ppt', label: '10 po → 1 ppt', cost: 10, gain: 1 },
    { from: 'ppt', to: 'po',  label: '1 ppt → 10 po', cost: 1,  gain: 10 },
  ];

  canConvert(from: string, cost: number): boolean {
    const val = Math.floor(this.moneyGroup().get(from)?.value || 0);
    return val >= cost;
  }

  convert(from: string, to: string, cost: number, gain: number): void {
    const group = this.moneyGroup();
    const fromCtrl = group.get(from);
    const toCtrl = group.get(to);

    if (!fromCtrl || !toCtrl) return;

    const fromVal = Math.floor(fromCtrl.value || 0);
    const toVal = Math.floor(toCtrl.value || 0);

    if (fromVal < cost) return;

    fromCtrl.setValue(fromVal - cost);
    toCtrl.setValue(toVal + gain);
  }
}
