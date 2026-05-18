import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { doc, collection, addDoc, deleteDoc, query, onSnapshot, getDoc, orderBy, updateDoc, where } from 'firebase/firestore';
import { Merchant } from '../interfaces/Merchant';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  collection: string = 'merchants';

  constructor(private firebase: FirebaseService) {}

  private merchantRef(sessionId: string) {
    return collection(this.firebase.db, `sessions/${sessionId}/${this.collection}`);
  }

  async saveMerchant(sessionId: string, merchant: Merchant) {
    return addDoc(this.merchantRef(sessionId), merchant);
  }

  async readMerchants(sessionId: string, callback: (merchants: any[]) => void) {
    const q = query(this.merchantRef(sessionId));

    return onSnapshot(q, snapshot => {
      const merchants: Merchant[] = [];

      snapshot.forEach(doc => {
        merchants.push({
          id: doc.id,
          ...doc.data()
        } as Merchant);
      });

      callback(merchants);
    });   
  }

  async deleteMerchant(sessionId: string, merchantId: string) {
    const docRef = doc(this.firebase.db, `sessions/${sessionId}/${this.collection}/${merchantId}`);
    return deleteDoc(docRef);
  }

  async updateMerchant(sessionId: string, merchantId: string, merchant: Partial<Merchant>) {
    const docRef = doc(this.firebase.db, `sessions/${sessionId}/${this.collection}/${merchantId}`);
    return updateDoc(docRef, merchant);
  }

    async getMerchantById(sessionId: string, merchantId: string) {
      const docRef = doc(this.firebase.db, `sessions/${sessionId}/${this.collection}/${merchantId}`)
      try {
        const snap = await getDoc(docRef);
        return snap.exists()
          ? { id: snap.id, ...(snap.data() as Merchant) }
          : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }

  
}
