import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Note } from '../../components/note/note';
import { DmnotesService } from '../../services/dmnotes.service';
import { ResultThrowFrameComponent } from '../../components/result.throw.frame.component/result.throw.frame.component';
import { GeneralThrowsButtonComponent } from '../../components/general.throws.button.component/general.throws.button.component';

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
  imports: [CommonModule, Note, ResultThrowFrameComponent, GeneralThrowsButtonComponent],
  templateUrl: './dm-notes.html',
  styleUrl: './dm-notes.css',
})
export class DmNotes implements OnInit, OnDestroy {
  maxNotes: number = 40;
  maxNotesExceeded: boolean = false;
  notes: NoteItem[] = [];
  sessionId: string = '';

  unsubscribe: (() => void) | undefined;

  newNote: NoteItem = {
    title: '',
    content: ''
  };

  constructor(
    private dmNotesService: DmnotesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    if (!this.sessionId) {
      console.error('No hay sesión activa en la URL');
      return;
    }

    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;
        this.maxNotesExceeded = this.notes.length > this.maxNotes;
      }
    );
  }

  async addNote() {
    if (!this.newNote.title || !this.newNote.content) return;
    await this.dmNotesService.createNote(this.sessionId, this.newNote);
    this.newNote = { title: '', content: ''};
  }

  async deleteNote(noteId: string) {
    if (!noteId) return;
    await this.dmNotesService.deleteNote(this.sessionId, noteId);
  }

  async updateNote(noteId: string) {
    if (!noteId) return;
    await this.dmNotesService.updateNote(this.sessionId, noteId, this.newNote);
    this.newNote = { title: '', content: ''};
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
