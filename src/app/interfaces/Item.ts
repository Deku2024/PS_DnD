export interface Item {
    id?: string;
    name: string;
    description: string;
    weight: number;
    quantity?: number;
}

export interface MerchantItemInfo {
  itemId: string;
  price: number;
  quantity: number;
}
