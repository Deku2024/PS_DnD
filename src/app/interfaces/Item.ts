export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface ItemInfo {
  item: Item;
  price: number;
  quantity: number;
}