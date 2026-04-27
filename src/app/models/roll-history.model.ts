import { ThrowsResult } from '../services/roll-dice.service';

export interface RollHistoryEntry {
  userId: string;
  userName: string;
  timestamp: number;
  data: ThrowsResult;
}
export interface SessionRollHistory {
  sessionId: string;
  rolls: RollHistoryEntry[];
  finalizedAt: any;
}
