import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  unsubscribe: (() => void) | undefined;

  constructor(
    private dmNotesService: DmnotesService,
    private route: ActivatedRoute,
    private sessionsService: SessionService
  ) {}

  ngOnInit() {
    const id = this.sessionsService.getCurrentSessionId();

    if (!id) {
      console.error('No hay id de la sesión.');
      return;
    }

    this.sessionId = id;

    console.log(this.sessionId)

    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;
        this.maxNotesExceeded = this.notes.length > this.maxNotes;
      }
    );
  }

  async addNote() {
    await this.dmNotesService.createNote(this.sessionId, {
      title: '',
      content: ''
    });
    console.log('nota creada exitosamente');
  }

  async deleteNote(noteId: string) {
    await this.dmNotesService.deleteNote(this.sessionId, noteId);
    console.log('nota borrada exitosamente');
    console.log(noteId);
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
