import { Component, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Item } from '../../interfaces/Item';

@Component({
  selector: 'app-merchant-form',
  imports: [ReactiveFormsModule],
  templateUrl: './merchant-form.html',
  styleUrl: './merchant-form.css',
})
export class MerchantForm implements OnInit {
  currentUser = input<string>();
  merchantForm: FormGroup;
  item: Item[] = [];

  ngOnInit(): void {
    this.loadUserItems();
  }

  constructor(private fb: FormBuilder, merchantService: MerchantService, private itemService: ItemServ) {
    this.merchantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sellingList: this.fb.group({}),
      buyingList: this.fb.group({})
    })
  }

  private loadUserItems() {

  }
}
