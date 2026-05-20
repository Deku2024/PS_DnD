import {Injectable} from '@angular/core';
import {
  addDoc,
  arrayUnion,
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
import {FirebaseService} from './firebase.service';
import {SheetInterface} from '../interfaces/SheetInterface';
import {SessionService} from './sessions.service';
import {AuthService} from './auth.service';

export interface Money {
  ppt: number;
  po: number;
  pe: number;
  pp: number;
  pc: number;
}

export interface CharacterData extends SheetInterface {
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

  constructor(private firebase: FirebaseService, private sessionService: SessionService, private auth : AuthService) {}

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

  async updateMultipleStats(characterId: string, stats: { [key: string]: number }): Promise<void> {
    if (!characterId || Object.keys(stats).length === 0) return;

    const charRef = doc(this.firebase.db, this.col, characterId);

    try {
      await updateDoc(charRef, {
        ...stats,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al actualizar estadísticas múltiples:", error);
      throw error;
    }
  }

  async addItemToInventory(characterId: string, item: { name: string, quantity: number, weight: number, description: string }): Promise<void> {
    const ref = doc(this.firebase.db, this.col, characterId);
    await updateDoc(ref, {
      inventory: arrayUnion(item),
      updatedAt: new Date().toISOString()
    });
  }

  async applyDamage(characterId: string, damage: number): Promise<void> {
    const ref = doc(this.firebase.db, this.col, characterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as CharacterData;
    const newLife = Math.max(0, current.life - damage);
    await updateDoc(ref, { life: newLife, updatedAt: new Date().toISOString() });
  }

  listenCharacter(characterId: string, cb: (char: CharacterWithId | null) => void): () => void {
    const ref = doc(this.firebase.db, this.col, characterId);
    const unsub = onSnapshot(ref, (snap) => {
      cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as CharacterData) } as CharacterWithId) : null);
    });
    return () => unsub();
  }

  calculateBonus(characteristicValue: number): number {
    return Math.floor((characteristicValue - 10) / 2);
  }

  async deleteCharacter(characterId: string) {
    const docRef = doc(this.firebase.db, `${this.col}/${characterId}`);
    return await deleteDoc(docRef);
  }

  getTotalValue(character : CharacterWithId) : number {
    return character.money.ppt * 10 +
      character.money.po +
      character.money.pe * 0.5 +
      character.money.pp * 0.1 +
      character.money.pc * 0.01;
  }

  hasThisCoin(character : CharacterWithId, coin :  {name : string, value : number}) : boolean {
    switch (coin.value) {
      case 10: return character.money.ppt > 0;
      case 1: return character.money.po > 0;
      case 0.5: return character.money.pe > 0;
      case 0.1: return character.money.pp > 0;
      case 0.01: return character.money.pc > 0;
    }
    return false;
  }

  getCoinAmount(character: CharacterWithId, coin: { name: string; value: number }): number {
    switch (coin.value) {
      case 10: return character.money.ppt;
      case 1: return character.money.po;
      case 0.5: return character.money.pe;
      case 0.1: return character.money.pp;
      case 0.01: return character.money.pc;
      default: return 0;
    }
  }

  async getSelectedCharacter(userId?: string): Promise<CharacterWithId | null> {
    if (!userId) {
      userId = this.auth.getCurrentUser()?.uid;
    }
    if (!userId) {
      return null;
    }
    const session = await this.sessionService.getSession(
      this.sessionService.getCurrentSessionId()!
    );
    if (!session || !session.selectedCharacters) {
      return null;
    }
    const characterId = session.selectedCharacters[userId];
    if (!characterId) {
      return null;
    }
    return this.getCharacterById(characterId);
  }
}
