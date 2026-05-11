import {Injectable} from '@angular/core';
import {CharacterWithId} from './character.service';
import {Item} from '../interfaces/Item';
import {Merchant} from '../interfaces/Merchant';

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  public sellItemToMerchant(character: CharacterWithId, item: Item, merchant: Merchant) : void {
    this.removeItemFromPlayerInventory(item, character, merchant);
    this.addItemToMerchant(item);
  }

  public buyItemFromMerchant(character: CharacterWithId, item: Item, merchant: Merchant) {
  }

  private removeItemFromPlayerInventory(item: Item, character: CharacterWithId, merchant: Merchant) {
    // esto se implementará más tarde, cuando se complete la refactorización del inventario
    character.money + merchant.buyingList[item.id].price;
  }

  private addItemToMerchant(item: Item) {
    // esto se implementará más tarde, cuando la definición de mercader esté completa
  }

  private addItemToPlayerInventory(item: Item, character: CharacterWithId, price: number) {
    
  }
}
