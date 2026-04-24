import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'money-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './money.component.html',
  styleUrl: './money.component.css'
})
export class MoneyComponent {
  moneyGroup = input.required<FormGroup>();
  getMoneyList() {
    return [
      { name: 'ppt', label: 'Platino (ppt)'},
      { name: 'po',  label: 'Oro (po)'},
      { name: 'pe',  label: 'Electro (pe)'},
      { name: 'pp',  label: 'Plata (pp)',},
      { name: 'pc',  label: 'Cobre (pc)'}
    ];
  }
}
