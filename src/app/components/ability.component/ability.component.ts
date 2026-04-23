import {Component, input, InputSignal, output} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'ability',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './ability.component.html',
  styleUrl: './ability.component.css',
})
export class AbilityComponent {
  itemGroup = input.required<FormGroup>();
  index = input.required<number>();
  remove = output<number>();

  removeAbility() {
    this.remove.emit(this.index())
  }
}
