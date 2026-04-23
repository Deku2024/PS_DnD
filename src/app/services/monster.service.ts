import { Injectable } from '@angular/core';
import { doc, collection, addDoc, deleteDoc, query, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface MonsterData {
  id?: string
  userId: string;
  name: string;
  armourClass: number;
  race: string;
  alignment: string;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MonsterService {
  private readonly collection = 'monsters';

  constructor(private Firebase: FirebaseService) {}

  private monsterRef() {
      return collection(this.Firebase.db, `monster`);
  }

  async createMonster(monster: MonsterData) {
    return await addDoc(this.monsterRef(), monster);
  }

  readMonster(monsterId: string, callback: (monsters: any) => void) {
    const monsterDoc = doc(this.Firebase.db, `monsters/${monsterId}`);
    return onSnapshot(monsterDoc, snapshot => {
      if (snapshot.exists()) {
        callback({
          id: snapshot.id,
          ...snapshot.data()
        });
      }
    });
  }

  async deleteMonster(monsterId: string) {
    const monsterDoc = doc(this.Firebase.db, `monsters/${monsterId}`);
    return await deleteDoc(monsterDoc);
  }

  async updateMonster(monsterId: string, data: any) {
    const monsterDoc = doc(this.Firebase.db, `monsters/${monsterId}`);

    return await updateDoc(monsterDoc, data);
  }  
}
