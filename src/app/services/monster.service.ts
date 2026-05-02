import { Injectable } from '@angular/core';
import { doc, collection, addDoc, deleteDoc, query, onSnapshot, getDoc, updateDoc, where } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { SheetInterface } from '../interfaces/SheetInterface';

export interface MonsterData extends SheetInterface {
  id?: string;
  challengeValue: number;
  challengePX: number;
}

@Injectable({
  providedIn: 'root',
})
export class MonsterService {
  private readonly collection = 'monsters';

  constructor(private Firebase: FirebaseService) {}

  private monsterRef() {
      return collection(this.Firebase.db, `${this.collection}`);
  }

  async createMonster(userId:string, monster: MonsterData) {
    return await addDoc(this.monsterRef(), {...monster, userId});
  }

  readMonsters(userId: string, callback: (monsters: any[]) => void) {
    const q = query(this.monsterRef(), where('userId', '==', userId));

    return onSnapshot(q, snapshot => {
      const monsters: MonsterData[] = [];

      snapshot.forEach(doc => {
        monsters.push({
          id: doc.id,
          ...doc.data()
        } as MonsterData);
      });

      callback(monsters);
    });
  }

  async deleteMonster(monsterId: string) {
    const monsterDoc = doc(this.Firebase.db, `monsters/${monsterId}`);
    return await deleteDoc(monsterDoc);
  }

  async updateMonster(monsterId: string, data: Partial<MonsterData>) {
    const monsterDoc = doc(this.Firebase.db, `monsters/${monsterId}`);

    return await updateDoc(monsterDoc, data);
  }

  async getMonsterById(monsterId: string) {
    const docRef = doc(this.Firebase.db, `${this.collection}/${monsterId}`)
    try {
      const snap = await getDoc(docRef);
      return snap.exists()
        ? { id: snap.id, ...(snap.data() as MonsterData) }
        : null;
    } catch (error) {
    console.error(error);
    return null;
  }
}
}
