import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { collection, addDoc, updateDoc, deleteDoc, where, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { Item } from '../interfaces/Item';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
    private readonly collection = 'items';
  
    constructor(private Firebase: FirebaseService) {}
  
    private itemRef() {
      return collection(this.Firebase.db, `${this.collection}`);
    }
  
    async createItem(userId:string, item: Item) {
      return await addDoc(this.itemRef(), {...item, userId});
    }
  
    readItems(userId: string, callback: (items: any[]) => void) {
      const q = query(this.itemRef(), where('userId', '==', userId));
  
      return onSnapshot(q, snapshot => {
        const items: any[] = [];
  
        snapshot.forEach(doc => {
          items.push({
            id: doc.id,
            ...doc.data()
          } as Item);
        });
  
        callback(items);
      });   
    }
  
    async deleteItem(itemId: string) {
      const itemDoc = doc(this.Firebase.db, `items/${itemId}`);
      return await deleteDoc(itemDoc);
    }
  
    async updateMonster(itemId: string, data: Partial<Item>) {
      const itemDoc = doc(this.Firebase.db, `items/${itemId}`);
  
      return await updateDoc(itemDoc, data);
    }
  
    async getMonsterById(itemId: string) {
      const docRef = doc(this.Firebase.db, `${this.collection}/${itemId}`)
      try {
        const snap = await getDoc(docRef);
        return snap.exists()
          ? { id: snap.id, ...(snap.data() as Item) }
          : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  
}
