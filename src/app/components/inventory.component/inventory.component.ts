import { Component, input, output } from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'inventory-item',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryItemComponent {
  itemGroup = input.required<FormGroup>();
  index = input.required<number>();
  remove = output<number>();

  public removeItem() {
    this.remove.emit(this.index());
  }
}
