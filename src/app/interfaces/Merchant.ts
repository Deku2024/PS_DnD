import {Item} from './Item';

export interface Merchant {
  id: string;
  name: string;
  sellingList: Record<string, {price: number, quantity: number}>;
  buyingList: Record<string, {price: number, quantity: number}>;
}