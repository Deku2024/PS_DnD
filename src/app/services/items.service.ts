import {Injectable} from '@angular/core';
import {FirebaseService} from './firebase.service';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import {Item} from '../interfaces/Item';

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

    async loadDefaultItems(): Promise<Item[]> {
      let items : Item[] = [];
      (await getDocs(collection(this.Firebase.db, 'defaultItems'))).forEach(doc => {
        items.push(doc.data() as Item);
      });
      return items;
    }

  getItemById(id: string): Promise<Item> {
    return getDoc(doc(this.Firebase.db, 'items', id)).then(docSnap => {
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          name: docSnap.data()['name'],
          description: docSnap.data()['description'],
          weight: docSnap.data()['weight'],
          quantity: docSnap.data()['quantity'] || 1
        } as Item;
      }
      throw new Error(`Item with id ${id} not found`);
    });
  }

}
