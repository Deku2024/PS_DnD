import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription, Observable } from 'rxjs';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { DiceRollerService, ThrowsResult } from './roll-dice.service';
import { SessionService } from './sessions.service';
import { FirebaseService } from './firebase.service';
import { UsernameService } from './username.service';
import { AuthService } from './auth.service';

export interface RollHistoryEntry {
  data: ThrowsResult;
  sessionId: string;
  timestamp: any;
  userId: string;
  userName: string;
}

@Injectable({ providedIn: 'root' })
export class RollHistoryService implements OnDestroy {
  private historyList: RollHistoryEntry[] = [];
  private historySubject = new Subject<RollHistoryEntry[]>();

  public history$: Observable<RollHistoryEntry[]> = this.historySubject.asObservable();
  public lastSeenCount: number = 0;
  private rollSub?: Subscription;
  private stopSnapshot?: () => void;
  private sessionStatus: string = 'active';
  private readonly rollsCol = 'rolls';
  private currentListeningSessionId: string | null = null;

  constructor(
    private diceRollerService: DiceRollerService,
    private sessionService: SessionService,
    private firebase: FirebaseService,
    private usernameService: UsernameService,
    private authService: AuthService
  ) {
    this.rollSub = this.diceRollerService.lastResult$.subscribe(async (result) => {
      if (this.sessionStatus === 'paused' || this.sessionStatus === 'waiting') return;

      const sessionId = this.sessionService.getCurrentSessionId();
      const user = this.authService.getCurrentUser();
      if (!sessionId || !user) return;

      const userName = this.usernameService.getCurrentUsername() || user.email || user.uid;
      const ref = collection(this.firebase.db, this.rollsCol);
      await addDoc(ref, {
        data: result,
        sessionId,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName
      });
    });
  }

  startListening(sessionId: string) {
    if (this.currentListeningSessionId && this.currentListeningSessionId !== sessionId) {
      this.historyList = [];
      this.lastSeenCount = 0;
      this.historySubject.next(this.historyList);
    }

    if (this.stopSnapshot) this.stopSnapshot();
    this.currentListeningSessionId = sessionId;

    const q = query(
      collection(this.firebase.db, this.rollsCol),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    this.stopSnapshot = onSnapshot(q, (snapshot) => {
      this.historyList = snapshot.docs.map(doc => doc.data() as RollHistoryEntry);
      this.historySubject.next(this.historyList);
    });
  }

  setSessionStatus(status: string): void {
    this.sessionStatus = status;
  }

  async saveAndClear(): Promise<void> {
    this.historyList = [];
    this.historySubject.next(this.historyList);
  }
  async deleteSessionRolls(sessionId: string): Promise<void> {
    const ref = collection(this.firebase.db, this.rollsCol);
    const q = query(ref, where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(doc(this.firebase.db, this.rollsCol, d.id)));
    await Promise.all(deletes);
  }

  getHistory(isMaster: boolean, currentUserId: string): RollHistoryEntry[] {
    if (isMaster) return [...this.historyList];
    return this.historyList.filter(e => e.userId === currentUserId);
  }

  clearHistory(): void {
    this.historyList = [];
    this.historySubject.next(this.historyList);
  }

  ngOnDestroy(): void {
    this.rollSub?.unsubscribe();
    this.stopSnapshot?.();
  }
}
