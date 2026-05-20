import {
  afterNextRender,
  Component,
  effect,
  inject,
  input,
  InputSignal,
  OnInit,
  output,
  signal,
  WritableSignal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CharacterService, CharacterWithId} from '../../services/character.service';
import {Merchant} from '../../interfaces/Merchant';
import {Item} from '../../interfaces/Item';
import {CommerceService} from '../../services/commerce.service';
import {ItemsService} from '../../services/items.service';

@Component({
  selector: 'app-commerce-component',
  imports: [CommonModule],
  templateUrl: './commerce.component.html',
  styleUrl: './commerce.component.css',
})
export class CommerceComponent implements OnInit {

  characterService = inject(CharacterService);
  commerceService = inject(CommerceService);
  itemService = inject(ItemsService);

  currentCharacter: InputSignal<CharacterWithId> = input({} as CharacterWithId);
  currentMerchant : InputSignal<Merchant> = input({} as Merchant);
  totalValueOnCharacter: WritableSignal<number> = signal(0);
  sellMode: WritableSignal<boolean> = signal(false);
  closeDisplay = output<boolean>();

  itemsCache: Map<string, Item> = new Map();

  constructor() {}

  async ngOnInit() {
    await this.loadItemsToCache();
    this.loadTotalValue();
  }

  private async loadItemsToCache() {
    for (const merchantItem of this.currentMerchant().sellingList) {
      if (!this.itemsCache.has(merchantItem.itemId)) {
        const item = await this.getItemById(merchantItem.itemId);
        if (item) {
          this.itemsCache.set(merchantItem.itemId, item);
        }
      }
    }

    for (const merchantItem of this.currentMerchant().buyingList) {
      if (!this.itemsCache.has(merchantItem.itemId)) {
        const item = await this.getItemById(merchantItem.itemId);
        if (item) {
          this.itemsCache.set(merchantItem.itemId, item);
        }
      }
    }
  }

  private loadTotalValue() {
    this.totalValueOnCharacter.set(
      this.characterService.getTotalValue(this.currentCharacter())
    );
  }



  hasItemInInventory(item: Item): boolean {
    return this.currentCharacter().inventory.some(
      cItem => item.name === cItem.name
    );
  }

  async getItemById(itemId: string): Promise<Item | null> {
    if (this.itemsCache.has(itemId)) {
      return this.itemsCache.get(itemId)!;
    }
    const item = await this.itemService.getItemById(itemId);
    if (item) {
      this.itemsCache.set(itemId, item);
    }
    return item;
  }

  getItemFromCache(itemId: string): Item | undefined {
    return this.itemsCache.get(itemId);
  }

  closeModal(): void {
    this.closeDisplay.emit(true);
  }
}
