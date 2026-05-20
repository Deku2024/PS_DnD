import { ChangeDetectorRef, Component, OnInit, effect, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Item } from '../../interfaces/Item';
import { ItemsService } from '../../services/items.service';
import { Merchant } from '../../interfaces/Merchant';
import { ItemSearch } from '../item-search/item-search';

@Component({
  selector: 'app-merchant-form',
  imports: [ReactiveFormsModule, ItemSearch],
  templateUrl: './merchant-form.html',
  styleUrl: './merchant-form.css',
})
export class MerchantForm implements OnInit {
  currentUserId = input.required<string>();
  merchant = input<Merchant | null>(null);
  merchantInfo = output<Merchant>();
  cancelEvent = output<boolean>();

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


    effect(() => {
      const merchant = this.merchant();

      if (merchant) {
        this.loadMerchantData(merchant);
      }
    })
  }

  private loadMerchantData(merchant: Merchant) {
    this.merchantForm.patchValue({
      name: merchant.name
    });

    this.sellingList.clear();
    this.buyingList.clear();

    merchant.sellingList.forEach(item => {
      this.sellingList.push(this.fb.group({
        itemId: [item.itemId],
        price: [item.price],
        quantity: [item.quantity]
      }))
    });

    merchant.buyingList.forEach(item => {
      this.buyingList.push(this.fb.group({
        itemId: [item.itemId],
        price: [item.price],
        quantity: [item.quantity]
      }))
    });


  }

  private loadUserItems() {
    if (this.currentUserId()) {
      this.unsubscribe = this.itemService.readItems(
            this.currentUserId(),
            (items) => {
              this.items = items;
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
      const merchantData: Merchant = {
        ...this.merchantForm.value
      };

    if (this.merchant()?.id) {
      merchantData.id = this.merchant()!.id;
    }

    this.merchantInfo.emit(merchantData);
    this.merchantForm.reset();
  }

  cancel() {
    this.merchantForm.reset();
    this.cancelEvent.emit(false);
  }

  //barra de búsqueda

  onSellingItemSelected(item: Item) {

    const exists = this.sellingList.controls.some(
      control => control.value.itemId === item.id
    );

    if (exists) return;

    this.addItemToSellingList(item, 0, 1);
  }

  onBuyingItemSelected(item: Item) {

    const exists = this.buyingList.controls.some(
      control => control.value.itemId === item.id
    );

    if (exists) return;

    this.addItemToBuyingList(item, 0, 1);
  }
}
