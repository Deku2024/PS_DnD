import { ChangeDetectorRef, Component, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Item } from '../../interfaces/Item';
import { ItemsService } from '../../services/items.service';

@Component({
  selector: 'app-merchant-form',
  imports: [ReactiveFormsModule],
  templateUrl: './merchant-form.html',
  styleUrl: './merchant-form.css',
})
export class MerchantForm implements OnInit {
  currentUserId = input.required<string>();
  merchantForm: FormGroup;
  items: Item[] = [];
  unsubscribe: (() => void) | undefined;

  ngOnInit(): void {
    this.loadUserItems();
  }

  constructor(private fb: FormBuilder, merchantService: MerchantService, private itemService: ItemsService, private ch: ChangeDetectorRef) {
    this.merchantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sellingList: this.fb.group({}),
      buyingList: this.fb.group({})
    })
  }

  private loadUserItems() {
    this.unsubscribe = this.itemService.readItems(
          this.currentUserId(),
          (monsters) => {
            this.items = monsters;
            this.ch.detectChanges();
          }
    )
  }

  // crear info de objetos de mercader
  
  createMerchantItem(item: Item): FormGroup {
    return this.fb.group({
      itemId: [item.id],
      price: [0],
      quantity: [1]
    });
  }

  //getters de sellingList y buyingList

  get sellingList(): FormArray {
    return this.merchantForm.get('sellingList') as FormArray;
  }

  get buyingList(): FormArray {
    return this.merchantForm.get('buyingList') as FormArray;
  }

  //Añadir items a las listas

  addItemToSellingList(item: Item) {
    this.sellingList.push(
      this.createMerchantItem(item)
    );
  }

  addItemToBuyingList(item: Item) {
    this.buyingList.push(
      this.createMerchantItem(item)
    );
  }

  getItemById(id: string): Item | undefined {
    return this.items.find(item => item.id === id);
  }
}
