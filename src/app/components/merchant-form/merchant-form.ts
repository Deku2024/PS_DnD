import { ChangeDetectorRef, Component, OnInit, effect, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
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

  sellingDuplicateError = '';
  buyingDuplicateError = '';;
  
  items: Item[] = [];
  unsubscribe: (() => void) | undefined;

  ngOnInit(): void {
    this.loadUserItems();
  }

  constructor(private fb: FormBuilder, merchantService: MerchantService, private itemService: ItemsService, private ch: ChangeDetectorRef) {
    this.merchantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sellingList: this.fb.array([], [this.minArrayLength(1)]),
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

  //validación del formulario
  minArrayLength(min: number) {

    return (control: AbstractControl): ValidationErrors | null => {

      const array = control as FormArray;

      return array.length >= min
        ? null
        : { minArrayLength: true };
    };
  }

  get nameControl() {
    return this.merchantForm.get('name');
  }

  //control de objetos duplicados
  private itemExists(list: FormArray, itemId: string): boolean {
    return list.controls.some(
      control => control.value.itemId === itemId
    );
  }


  // crear info de objetos de mercader
  
  createMerchantItem(item: Item, price: number, quantity: number): FormGroup {
    return this.fb.group({
      itemId: [item.id],
      price: [price, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      quantity: [quantity, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
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
    if (this.merchantForm.invalid) {

      this.merchantForm.markAllAsTouched();

      return;
    }

    const merchantData: Merchant = {
      ...this.merchantForm.value
    };

    if (this.merchant()?.id) {
      merchantData.id = this.merchant()!.id;
    }

    this.merchantInfo.emit(merchantData);

    this.resetForm();
  }

  resetForm() {
    this.merchantForm.reset({
      name: ''
    });

    this.sellingList.clear();
    this.buyingList.clear();
  }

  cancel() {
    this.resetForm();
    this.cancelEvent.emit(false);
  }

  //barra de búsqueda

  onSellingItemSelected(item: Item) {

    if (this.itemExists(this.sellingList, item.id!)) {
      this.sellingDuplicateError = 'Ese objeto ya está en venta';
      setTimeout(() => {
        this.sellingDuplicateError = '';
      }, 3000);

      return;
    }

    this.sellingDuplicateError = '';

    this.addItemToSellingList(item, 0, 1);
  }

  onBuyingItemSelected(item: Item) {

    if (this.itemExists(this.buyingList, item.id!)) {
        this.buyingDuplicateError = 'Ese objeto ya está en compra';
        setTimeout(() => {
          this.buyingDuplicateError = '';
        }, 3000);
      return;
    }

    this.buyingDuplicateError = '';

    this.addItemToBuyingList(item, 0, 1);
  }
}
