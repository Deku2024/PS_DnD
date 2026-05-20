import {Component, inject, signal, WritableSignal, OnInit, output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, CharacterWithId } from '../../services/character.service';
import { Merchant } from '../../interfaces/Merchant';
import { Item } from '../../interfaces/Item';
import { CommerceService } from '../../services/commerce.service';
import { ItemsService } from '../../services/items.service';

@Component({
  selector: 'app-commerce-component',
  imports: [CommonModule], // 👈 Añade CommonModule para ngIf, ngFor, etc.
  templateUrl: './commerce.component.html',
  styleUrl: './commerce.component.css',
})
export class CommerceComponent implements OnInit { // 👈 Implementa OnInit

  characterService = inject(CharacterService);
  commerceService = inject(CommerceService);
  itemService = inject(ItemsService);

  // 👈 Inicializa los signals correctamente
  currentCharacter: WritableSignal<CharacterWithId> = signal({} as CharacterWithId);
  currentMerchant: WritableSignal<Merchant> = signal({} as Merchant);
  totalValueOnCharacter: WritableSignal<number> = signal(0);
  sellMode: WritableSignal<boolean> = signal(false);
  closeDisplay = output<boolean>();

  // 👈 Cache para items
  itemsCache: Map<string, Item> = new Map();

  constructor() {}

  async ngOnInit() {
    await this.loadCurrentCharacter();
  }

  private async loadCurrentCharacter() {
    const character = await this.characterService.getSelectedCharacter();
    this.currentCharacter.set(character!);
    this.loadTotalValue();
  }

  setCurrentMerchant(merchant: Merchant) {
    this.currentMerchant.set(merchant);
    this.loadTotalValue();
    this.loadItemsToCache(); // Cargar items al cache
  }

  private async loadItemsToCache() {
    const merchant = this.currentMerchant();

    for (const merchantItem of merchant.sellingList) {
      if (!this.itemsCache.has(merchantItem.itemId)) {
        const item = await this.getItemById(merchantItem.itemId);
        if (item) {
          this.itemsCache.set(merchantItem.itemId, item);
        }
      }
    }

    for (const merchantItem of merchant.buyingList) {
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

  buyItem(item: Item): void {
    this.commerceService.buyItemFromMerchant(
      this.currentCharacter(),
      item,
      this.currentMerchant()
    );
    this.loadTotalValue();
    this.loadCurrentCharacter(); // Recargar personaje
  }

  sellItem(item: Item): void {
    this.commerceService.sellItemToMerchant(
      this.currentCharacter(),
      item,
      this.currentMerchant()
    );
    this.loadTotalValue();
    this.loadCurrentCharacter(); // Recargar personaje
  }

  alterMode(): void {
    this.sellMode.set(!this.sellMode());
  }

  hasItemInInventory(item: Item): boolean {
    return this.currentCharacter().inventory.some(
      cItem => item.name === cItem.name
    );
  }

  async getItemById(itemId: string): Promise<Item | null> {
    // Primero buscar en cache
    if (this.itemsCache.has(itemId)) {
      return this.itemsCache.get(itemId)!;
    }

    // Si no está en cache, buscar en Firestore
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
