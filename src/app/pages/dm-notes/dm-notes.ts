import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Note } from '../../components/note/note';
import { DmnotesService } from '../../services/dmnotes.service';
import { ResultThrowFrameComponent } from '../../components/result.throw.frame.component/result.throw.frame.component';
import { GeneralThrowsButtonComponent } from '../../components/general.throws.button.component/general.throws.button.component';
import { SessionService, Session } from '../../services/sessions.service';
import { FormsModule } from '@angular/forms';
import { DmFloatingMenuComponent } from '../../components/dm-floating-menu.component/dm-floating-menu.component';
import { HistoryButtonComponent } from '../../components/history.button.component/history.button.component';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';

interface NoteItem {
  id?: string;
  title: string,
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: 'app-dm-notes',
  standalone: true,
  imports: [CommonModule, Note, FormsModule, ResultThrowFrameComponent, GeneralThrowsButtonComponent, DmFloatingMenuComponent, HistoryButtonComponent],
  templateUrl: './dm-notes.html',
  styleUrl: './dm-notes.css',
})
export class DmNotes implements OnInit, OnDestroy {
  maxNotes: number = 40;
  maxNotesExceeded: boolean = false;
  notes: NoteItem[] = [];
  sessionId: string = '';
  sortCriteria: string = 'newest';

  session: Session | null = null;
  currentUser: User | null = null;
  isMaster: boolean = false;
  private unsubSession?: () => void;
  unsubscribe: (() => void) | undefined;

  constructor(
    private dmNotesService: DmnotesService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionsService: SessionService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const paramId = this.route.snapshot.queryParamMap.get('sessionId');
    const id = paramId || this.sessionsService.getCurrentSessionId();

    if (!id) return;

    if (paramId) {
      this.sessionsService.setCurrentSessionId(paramId);
    }

    this.sessionId = id;

    this.currentUser = await new Promise<any>(resolve =>
      this.authService.onAuthState().subscribe(u => resolve(u))
    );

    this.unsubSession = this.sessionsService.listenSession(this.sessionId, (s) => {
      if (s) {
        this.session = s;
        this.isMaster = s.masterId === this.currentUser?.uid;
        this.cd.detectChanges();
      }
    });

    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;
        this.sortNotes();
        this.maxNotesExceeded = this.notes.length > this.maxNotes;
        this.cd.detectChanges();
      }
    );
  }

  sortNotes() {
    if (!this.notes) return;

    this.notes.sort((a, b) => {
      switch (this.sortCriteria) {
        case 'newest':
          return this.getTime(b.createdAt) - this.getTime(a.createdAt);
        case 'oldest':
          return this.getTime(a.createdAt) - this.getTime(b.createdAt);
        case 'alphaAsc':
          return (a.title || '').localeCompare(b.title || '');
        case 'alphaDesc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });
  }

  private getTime(dateVal: any): number {
    if (!dateVal) return 0;
    if (typeof dateVal.toMillis === 'function') return dateVal.toMillis();
    if (dateVal instanceof Date) return dateVal.getTime();
    if (typeof dateVal.seconds === 'number') return dateVal.seconds * 1000;
    return new Date(dateVal).getTime() || 0;
  }

  async addNote() {
    await this.dmNotesService.createNote(this.sessionId, {
      title: '',
      content: ''
    });
  }

  async deleteNote(noteId: string) {
    await this.dmNotesService.deleteNote(this.sessionId, noteId);
  }

  goToSession() {
    if (!this.sessionId) return;
    this.router.navigate(['/session', this.sessionId]);
  }

  triggerHistoryDrawer(): void {
    const historyComp = document.querySelector('history-button-component');
    if (historyComp) {
      const triggerButton = historyComp.querySelector('button, .btn') || historyComp.firstElementChild;
      if (triggerButton) {
        (triggerButton as HTMLElement).click();
      }
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.unsubSession) this.unsubSession();
  }
}
