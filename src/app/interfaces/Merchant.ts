import {Item, MerchantItemInfo} from './Item';

export interface Merchant {
  id?: string;
  name: string;
  sellingList: MerchantItemInfo[]; //lista de objetos que vende el mercader 
  buyingList: MerchantItemInfo[]; //lista de objetos que compra el mercader
}