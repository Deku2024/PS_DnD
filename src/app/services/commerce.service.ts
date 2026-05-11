import {Injectable} from '@angular/core';
import {CharacterWithId} from './character.service';
import {Item} from '../interfaces/Item';
import {Merchant} from '../interfaces/Merchant';

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  public sellItemToMerchant(character: CharacterWithId, item: Item, merchant: Merchant) : void {
    this.removeItemFromPlayerInventory(item, character, merchant.sellingList[item].price);
    this.addItemToMerchant(item, merchant);
  }

  public buyItemFromMerchant(character: CharacterWithId, item: Item, merchant: Merchant) {
    this.removeItemFromMerchant(item, merchant);
    this.addItemToPlayerInventory(item, character, merchant.buyingList[item].price);
  }

  private removeItemFromPlayerInventory(item: Item, character: CharacterWithId, price: number) {
    // esto se implementará más tarde, cuando se complete la refactorización del inventario
    character.money + price;
  }

  private addItemToPlayerInventory(item: Item, character: CharacterWithId, price: number) {

  }

  private addItemToMerchant(item: Item, merchant: Merchant) {
    // esto se implementará más tarde, cuando la definición de mercader esté completa
  }

  private removeItemFromMerchant(item: Item, merchant: Merchant) {

  }
}
