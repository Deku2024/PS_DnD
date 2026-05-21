import {inject, Injectable} from '@angular/core';
import {Merchant} from '../interfaces/Merchant';
import {CharacterService, CharacterWithId} from './character.service';
import {Item, MerchantItemInfo} from '../interfaces/Item';
import {MerchantService} from './merchant.service';
import {SessionService} from './sessions.service';

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  merchantService = inject(MerchantService);
  characterService = inject(CharacterService);
  sessionService = inject(SessionService);

  coinOrder = [
    { name: 'ppt', value: 10 },
    { name: 'po', value: 1 },
    { name: 'pe', value: 0.5 },
    { name: 'pp', value: 0.1 },
    { name: 'pc', value: 0.01 }
  ];

  buyItemFromMerchant(character : CharacterWithId, item : Item, merchant : Merchant) {
    const merchantItem = merchant.sellingList.find(mItem => item.id === mItem.itemId);
    const characterItem = character.inventory.find(cItem => item.name === cItem.name);
    this.addItemToCharacter(characterItem, character, item, merchantItem?.price!);
    this.reduceStock(merchantItem, merchant, item);
    this.updateFiles(character, merchant);
  }

  private updateFiles(character: CharacterWithId, merchant: Merchant) {
    this.characterService.updateCharacter(character.id, character);
    this.merchantService.updateMerchant(this.sessionService.getCurrentSessionId()!, merchant.id!, merchant);
  }

  private reduceStock(merchantItem: MerchantItemInfo | undefined, merchant: Merchant, item: Item) {
    if (merchantItem) {
      merchantItem.quantity--;
      this.removeItemFromMerchant(merchantItem, merchant, item);
    } else {
      throw new Error('Item not found.');
    }
  }

  private removeItemFromMerchant(merchantItem: MerchantItemInfo, merchant: Merchant, item: Item) {
    if (merchantItem.quantity <= 0) {
      merchant.sellingList.splice(
        merchant.sellingList.findIndex(mIten => mIten.itemId === item.id)
        , 1);
    }
  }

  private addItemToCharacter(characterItem: {
    name: string;
    quantity: number;
    description: string
  } | undefined, character: CharacterWithId, item: Item, price: number) {
    this.increaseItemCountInInventory(characterItem, character, item);
    this.payPrice(price, character);
  }

  private payPrice(price: number, character: CharacterWithId) {
    let remainingPrice = price;
    for (const coin of this.coinOrder) {

      if (Math.floor(remainingPrice / coin.value) > 0) {
        const coinsToUse = Math.min(
          Math.floor(remainingPrice / coin.value),
          this.characterService.getCoinAmount(character, coin)
        );
        this.removeCoins(coinsToUse, coin, character);
        remainingPrice = Math.round((coinsToUse * coin.value) * 100) / 100;
      }
      if (remainingPrice <= 0) break;
    }
  }

  private removeCoins(coinsToUse: number, coin: { name: string; value: number }, character: CharacterWithId) {
    for (let i = 0; i < coinsToUse; i++) {
      this.removeTypeOfCoin(coin, character);
    }
  }

  private addChange(price: number, character: CharacterWithId) {
    let coinsLeft = this.coinOrder;
    let leftChange = price;
    while (coinsLeft.length !== 0) {
      if (coinsLeft[0].value >= leftChange) {
        leftChange -= coinsLeft[0].value;
        this.addTypeOfCoin(coinsLeft[0], character);
      } else {
        coinsLeft.shift();
      }
    }
  }

  private addTypeOfCoin(coin: { name: string; value: number }, character: CharacterWithId) {
    switch (coin.value) {
      case 10:
        character.money.ppt++;
        break;
      case 1:
        character.money.po++;
        break;
      case 0.5:
        character.money.pe++;
        break;
      case 0.1:
        character.money.pp++;
        break;
      case 0.01:
        character.money.pc++;
        break;
    }
  }

  private removeTypeOfCoin(coin: { name: string; value: number }, character: CharacterWithId) {
    switch (coin.value) {
      case 10:
        character.money.ppt--;
        break;
      case 1:
        character.money.po--;
        break;
      case 0.5:
        character.money.pe--;
        break;
      case 0.1:
        character.money.pp--;
        break;
      case 0.01:
        character.money.pc--;
        break;
    }
  }

  private increaseItemCountInInventory(characterItem: {
    name: string;
    quantity: number;
    description: string
  } | undefined, character: CharacterWithId, item: Item) {
    if (!characterItem) {
      character.inventory.push({
        name: item.name,
        description: item.description,
        quantity: 1,
      });
    } else {
      characterItem.quantity++;
    }
  }

  sellItemToMerchant(character: CharacterWithId, item: Item, merchant: Merchant) {
    const merchantItem = merchant.buyingList.find(mItem => item.id === mItem.itemId);
    const characterItem = character.inventory.find(cItem => cItem.name === item.name);
    this.removeItemFromCharacter(characterItem, character, item, merchantItem?.price!);
    this.increaseStock(merchantItem, merchant, item);
    this.updateFiles(character, merchant);
  }

  private removeItemFromCharacter(characterItem: {
    name: string;
    quantity: number;
    description: string
  } | undefined, character: CharacterWithId, item: Item, price: number) {
    this.decreaseItemCountInInventory(characterItem, character, item);
    this.receiveMoney(price, character);
  }

  private receiveMoney(price: number, character: CharacterWithId) {
    let remainingMoney = price;
    for (const coin of this.coinOrder) {
      if (remainingMoney <= 0) break;
      if (Math.floor(remainingMoney / coin.value) > 0) {
        this.addCoins(
          Math.floor(remainingMoney / coin.value),
          coin,
          character
        );
        remainingMoney -= Math.floor(remainingMoney / coin.value) * coin.value;
        remainingMoney = Math.round(remainingMoney * 100) / 100;
      }
    }
  }

  private addCoins(coinsToAdd: number, coin: { name: string; value: number }, character: CharacterWithId) {
    for (let i = 0; i < coinsToAdd; i++) {
      this.addTypeOfCoin(coin, character);
    }
  }

  private increaseStock(merchantItem: MerchantItemInfo | undefined, merchant: Merchant, item: Item) {
    if (merchantItem) {
      merchantItem.quantity++;
    } else {
      throw new Error('El mercader no quiere este item');
    }
  }

  private decreaseItemCountInInventory(characterItem: {
    name: string;
    quantity: number;
    description: string
  } | undefined, character: CharacterWithId, item: Item) {
    if (characterItem) {
      if (characterItem.quantity <= 1) {
        const index = character.inventory.findIndex(cItem => cItem.name === item.name);
        character.inventory.splice(index, 1);
      } else {
        characterItem.quantity--;
      }
    } else {
      throw new Error('Item not found in inventory');
    }
  }
}
