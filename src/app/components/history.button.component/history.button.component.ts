import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RollHistoryService, RollHistoryEntry } from '../../services/roll-history.service';
import { RollHistoryComponent } from '../roll-history.component/roll-history.component';
import { FinalizeSessionComponent } from '../finalize-session.component/finalize-session.component';
import { SessionHistoryComponent } from '../session-history.component/session-history.component';

@Component({
  selector: 'history-button-component',
  standalone: true,
  imports: [CommonModule, RollHistoryComponent, FinalizeSessionComponent, SessionHistoryComponent],
  templateUrl: './history.button.component.html',
  styleUrl: './history.button.component.css'
})
export class HistoryButtonComponent implements OnInit, OnDestroy {
  @Input() isMaster: boolean = false;
  @Input() currentUserId: string = '';
  @Input() sessionId: string = '';
  @Input() sessionName: string = '';
  @Input() masterId: string = '';
  @Input() masterName: string = '';
  @Input() players: string[] = [];
  @Input() playerEmails: { [uid: string]: string } = {};
  @Input() playerUsernames: { [uid: string]: string } = {};

  @ViewChild(SessionHistoryComponent) historyListRef?: SessionHistoryComponent;

  isOpen: boolean = false;
  activeTab: 'rolls' | 'sessions' = 'rolls';
  showFinalizeModal: boolean = false;
  entries: RollHistoryEntry[] = [];

  private sub?: Subscription;

  constructor(private rollHistoryService: RollHistoryService) {}

  ngOnInit(): void {
    this.entries = this.rollHistoryService.getHistory(this.isMaster, this.currentUserId);
    this.sub = this.rollHistoryService.history$.subscribe(() => {
      this.entries = this.rollHistoryService.getHistory(this.isMaster, this.currentUserId);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    console.log("Datos en el Padre (HistoryButton):", {
      master: this.masterId,
      players: this.players
    });
    if (this.isOpen) {
      this.rollHistoryService.lastSeenCount = this.entries.length;
    }
  }

  close(): void {
    this.isOpen = false;
    this.showFinalizeModal = false;
    this.rollHistoryService.lastSeenCount = this.entries.length;
  }

  setTab(tab: 'rolls' | 'sessions'): void {
    this.activeTab = tab;
  }

  get count(): number {
    return this.entries.length - this.rollHistoryService.lastSeenCount;
  }

  get pastSessionCount(): number {
    return this.historyListRef?.count ?? 0;
  }

  onFinalized(): void {
    this.showFinalizeModal = false;
    this.activeTab = 'sessions';
    this.historyListRef?.load();
  }
}
