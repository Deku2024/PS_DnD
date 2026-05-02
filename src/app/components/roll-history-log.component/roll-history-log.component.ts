import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RollHistoryService } from '../../services/roll-history.service';
import { SessionService } from '../../services/sessions.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-roll-history-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roll-history-log.component.html',
  styleUrls: ['./roll-history-log.component.css']
})
export class RollHistoryLogComponent implements OnInit {
  private historyService = inject(RollHistoryService);
  private sessionService = inject(SessionService);

  history$!: Observable<any[]>;

  ngOnInit() {
    const sessionId = this.sessionService.getCurrentSessionId();
    if (sessionId) {
      this.history$ = this.historyService.getHistoryBySession(sessionId);
    }
  }
}
