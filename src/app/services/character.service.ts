import { Injectable } from '@angular/core';
import { collection, doc, getDoc, addDoc, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import {SheetInterface} from '../interfaces/SheetInterface';

export interface Money {
  ppt: number;
  po: number;
  pe: number;
  pp: number;
  pc: number;
}
export interface CharacterData extends SheetInterface{
  sessionId: string;
  age: number;
  experience: number;
  race: string;
  class: string;
  money: Money;
  updatedAt: string;
}

export interface CharacterWithId extends CharacterData {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly col = 'characters';

  constructor(private firebase: FirebaseService) {}

  async getCharacterById(id: string): Promise<CharacterWithId | null> {
    const ref = doc(this.firebase.db, this.col, id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as CharacterData) } as CharacterWithId) : null;
  }

  async listCharactersByUserAndSession(userId: string, sessionId: string): Promise<CharacterWithId[]> {
    const colRef = collection(this.firebase.db, this.col);
    const q = query(colRef, where('userId', '==', userId), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    const out: CharacterWithId[] = [];
    snap.forEach((d) => out.push({ id: d.id, ...(d.data() as CharacterData) } as CharacterWithId));
    return out;
  }

  listenCharactersByUserAndSession(userId: string, sessionId: string, cb: (chars: CharacterWithId[]) => void): () => void {
    const colRef = collection(this.firebase.db, this.col);
    const q = query(colRef, where('userId', '==', userId), where('sessionId', '==', sessionId));
    const unsub = onSnapshot(q, (snap) => {
      const out: CharacterWithId[] = [];
      snap.forEach((d) => out.push({ id: d.id, ...(d.data() as CharacterData) } as CharacterWithId));
      cb(out);
    }, (err) => {
      console.error('listenCharactersByUserAndSession error', err);
    });
    return () => unsub();
  }

  async createCharacter(userId: string, sessionId: string, data: Omit<CharacterData, 'userId' | 'sessionId' | 'updatedAt'>): Promise<string> {
    const colRef = collection(this.firebase.db, this.col);
    const docRef = await addDoc(colRef, { ...data, userId, sessionId, updatedAt: new Date().toISOString() });
    return docRef.id;
  }

  async updateCharacter(characterId: string, data: Partial<Omit<CharacterData, 'userId' | 'sessionId' | 'updatedAt'>>): Promise<void> {
    const ref = doc(this.firebase.db, this.col, characterId);
    await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
  }

  calculateBonus(characteristicValue: number): number {
    return Math.floor((characteristicValue - 10) / 2);
  }

  async deleteCharacter(characterId: string) {
    const docRef = doc(this.firebase.db, `${this.col}/${characterId}`);
    return await deleteDoc(docRef);
  }

}
