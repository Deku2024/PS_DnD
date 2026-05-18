import {Item} from './Item';

export interface Merchant {
  id?: string;
  name: string;
  sellingList: Record<string, {price: number, quantity: number}>; // lista de venta del mercader -> lo que compran los jugadores
  buyingList: Record<string, {price: number, quantity: number}>; // lista de compra del mercader -> lo que venden los jugadores
}