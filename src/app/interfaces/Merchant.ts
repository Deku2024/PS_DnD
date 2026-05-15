import {Item, ItemInfo} from './Item';

export interface Merchant {
  id?: string;
  name: string;
  sellingList: Record<string, ItemInfo>; //lista de objetos que vende el mercader string: id del Item, ItemInfo: ver interfaz
  buyingList: Record<string, ItemInfo>; //lista de objetos que compra el mercader string: id del Item, ItemInfo: ver interfaz
}