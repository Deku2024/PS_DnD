import { Component, input, output, effect } from '@angular/core';
import {FormGroup, ReactiveFormsModule, FormBuilder} from '@angular/forms';
import { Item } from './../../interfaces/Item';

@Component({
  selector: 'inventory-item',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryItemComponent {
  remove = output<Item>();
  save = output<Item>();

  isInInventory = input<boolean>(false);
  item = input<Item | null>(null);

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      quantity: [''],
      weight: [''],
      name: [''],
      description: [''],
    });

    effect(() => {
      if (this.isInInventory()) {
        this.form.disable();
      } else {
        this.form.enable();
      }

      const currentItem = this.item();

      if (!currentItem) {
        this.form.reset();
        return;
      }

      this.form.patchValue({
        quantity: currentItem.quantity,
        weight: currentItem.weight,
        name: currentItem.name,
        description: currentItem.description,
      });

    });
  }

  public saveItem() {
    const item: Item = {
      ...this.item(),
      ...this.form.getRawValue(),
    };
    this.save.emit(item);
    this.form.reset();
  }

  public removeItem() {
    const item: Item = {
      ...this.item(),
      ...this.form.getRawValue(),
    };
    this.remove.emit(item);
  }
}
