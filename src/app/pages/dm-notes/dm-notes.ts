import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Note } from '../../components/note/note';
import { DmnotesService } from '../../services/dmnotes.service';
import { ResultThrowFrameComponent } from '../../components/result.throw.frame.component/result.throw.frame.component';
import { GeneralThrowsButtonComponent } from '../../components/general.throws.button.component/general.throws.button.component';
import { SessionService } from '../../services/sessions.service';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, Note, FormsModule, ResultThrowFrameComponent, GeneralThrowsButtonComponent],
  templateUrl: './dm-notes.html',
  styleUrl: './dm-notes.css',
})
export class DmNotes implements OnInit, OnDestroy {
  maxNotes: number = 40;
  maxNotesExceeded: boolean = false;
  notes: NoteItem[] = [];
  sessionId: string = '';

  // NUEVO: Variable para guardar el criterio de ordenación seleccionado
  sortCriteria: string = 'newest';

  unsubscribe: (() => void) | undefined;

  constructor(
    private dmNotesService: DmnotesService,
    private route: ActivatedRoute,
    private router: Router,
    private sessionsService: SessionService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const paramId = this.route.snapshot.queryParamMap.get('sessionId');
    const id = paramId || this.sessionsService.getCurrentSessionId();

    if (!id) {
      console.error('No hay id de la sesión.');
      return;
    }

    if (paramId) {
      this.sessionsService.setCurrentSessionId(paramId);
    }

    this.sessionId = id;

    console.log(this.sessionId)

    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;
        // NUEVO: Ordenamos las notas automáticamente al recibirlas o al haber un cambio
        this.sortNotes();
        this.maxNotesExceeded = this.notes.length > this.maxNotes;
        this.cd.detectChanges();
      }
    );

  }

  // NUEVO: Función para ordenar el array de notas según el criterio
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

  // NUEVO: Función auxiliar para extraer el tiempo de forma segura (sea Timestamp de Firebase o Date normal)
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

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
