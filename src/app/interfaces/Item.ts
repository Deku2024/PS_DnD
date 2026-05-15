export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface MerchantItemInfo {
  itemId: string;
  price: number;
  quantity: number;
}