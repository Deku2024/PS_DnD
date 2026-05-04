import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { RollHistoryEntry } from './roll-history.service';

export interface SessionHistoryRecord {
  id?: string;
  sessionId: string;
  sessionName: string;
  description: string;
  masterId: string;
  masterName: string;
  players: string[];
  playerUsernames: { [uid: string]: string };
  rollCount: number;
  rolls: RollHistoryEntry[];
  finishedAt: any;
}

@Injectable({ providedIn: 'root' })
export class SessionHistoryService {
  private readonly col = 'session-history';

  constructor(private firebase: FirebaseService) {}

  async saveSessionHistory(record: Omit<SessionHistoryRecord, 'id' | 'finishedAt'>): Promise<void> {
    const ref = collection(this.firebase.db, this.col);
    await addDoc(ref, {
      ...record,
      finishedAt: serverTimestamp()
    });
  }

  async getHistoryBySession(sessionId: string): Promise<SessionHistoryRecord[]> {
    const ref = collection(this.firebase.db, this.col);
    const q = query(ref, where('sessionId', '==', sessionId), orderBy('finishedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionHistoryRecord));
  }

  async getHistoryByMaster(masterId: string): Promise<SessionHistoryRecord[]> {
    const ref = collection(this.firebase.db, this.col);
    const q = query(ref, where('masterId', '==', masterId), orderBy('finishedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionHistoryRecord));
  }

  async getHistoryByPlayer(userId: string): Promise<SessionHistoryRecord[]> {
    const ref = collection(this.firebase.db, this.col);
    const q = query(ref, where('players', 'array-contains', userId), orderBy('finishedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionHistoryRecord));
  }
}
