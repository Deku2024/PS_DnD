import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Item } from '../../interfaces/Item';

@Component({
  selector: 'app-item-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-search.html',
  styleUrl: './item-search.css',
})
export class ItemSearch {
  items = input.required<Item[]>();
  placeholder = input<string>('Buscar objeto...');

  itemSelected = output<Item>();

  searchTerm = '';
  filteredItems: Item[] = [];

  filterItems() {

    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredItems = [];
      return;
    }

    this.filteredItems = this.items().filter(item =>
      item.name.toLowerCase().includes(term)
    );
  }

  selectItem(item: Item) {
    console.log(item.id)

    this.itemSelected.emit(item);

    this.searchTerm = '';
    this.filteredItems = [];
  }
}
