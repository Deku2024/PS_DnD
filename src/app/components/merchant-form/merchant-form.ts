import { ChangeDetectorRef, Component, OnInit, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Item } from '../../interfaces/Item';
import { ItemsService } from '../../services/items.service';
import { Merchant } from '../../interfaces/Merchant';

@Component({
  selector: 'app-merchant-form',
  imports: [ReactiveFormsModule],
  templateUrl: './merchant-form.html',
  styleUrl: './merchant-form.css',
})
export class MerchantForm implements OnInit {
  currentUserId = input.required<string>();
  merchantInfo = output<Merchant>();
  merchantForm: FormGroup;
  items: Item[] = [];
  unsubscribe: (() => void) | undefined;

  ngOnInit(): void {
    this.loadUserItems();
  }

  constructor(private fb: FormBuilder, merchantService: MerchantService, private itemService: ItemsService, private ch: ChangeDetectorRef) {
    this.merchantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sellingList: this.fb.array([]),
      buyingList: this.fb.array([])
    })
  }

  private loadUserItems() {
    if (this.currentUserId()) {
      this.unsubscribe = this.itemService.readItems(
            this.currentUserId(),
            (monsters) => {
              this.items = monsters;
              this.ch.detectChanges();
            }
      )
    }
  }

  // crear info de objetos de mercader
  
  createMerchantItem(item: Item, price: number, quantity: number): FormGroup {
    return this.fb.group({
      itemId: [item.id],
      price: [price],
      quantity: [quantity]
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

  addItemToSellingList(item: Item, price: number, quantity: number) {
    this.sellingList.push(
      this.createMerchantItem(item, price, quantity)
    );
  }

  addItemToBuyingList(item: Item, price: number, quantity: number) {
    this.buyingList.push(
      this.createMerchantItem(item, price, quantity)
    );
  }

  getItemById(id: string): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  saveMerchant() {
    this.merchantInfo.emit(this.merchantForm.value);
  }
}
