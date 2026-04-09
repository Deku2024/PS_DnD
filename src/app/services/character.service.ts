import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface CharacterData {
  userId: string;
  sessionId: string;
  name: string;
  age: number;
  experience: number;
  life: number;
  maxLife: number;
  tempLife: number;
  armourClass: number;
  race: string;
  class: string;
  alignment: string;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  gold: number;
  inventory: { name: string; quantity: number; description: string }[];
  abilities: { name: string; description: string }[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly col = 'characters';

  constructor(private firebase: FirebaseService) {}

  private docId(userId: string, sessionId: string): string {
    return `${userId}_${sessionId}`;
  }

  async hasCharacter(userId: string, sessionId: string): Promise<boolean> {
    const ref = doc(this.firebase.db, this.col, this.docId(userId, sessionId));
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async saveCharacter(userId: string, sessionId: string, data: Omit<CharacterData, 'userId' | 'sessionId' | 'updatedAt'>): Promise<void> {
    const ref = doc(this.firebase.db, this.col, this.docId(userId, sessionId));
    await setDoc(ref, { ...data, userId, sessionId, updatedAt: new Date().toISOString() });
  }

  async getCharacter(userId: string, sessionId: string): Promise<CharacterData | null> {
    const ref = doc(this.firebase.db, this.col, this.docId(userId, sessionId));
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CharacterData) : null;
  }
}
