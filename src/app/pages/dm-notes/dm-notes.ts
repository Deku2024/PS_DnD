import { Component, OnInit, OnDestroy, ɵisSubscribable } from '@angular/core';
import { Note } from '../../components/note/note';
import { DmnotesService } from '../../services/dmnotes.service';
import {ResultThrowFrameComponent} from '../../components/result.throw.frame.component/result.throw.frame.component';
import {
  GeneralThrowsButtonComponent
} from '../../components/general.throws.button.component/general.throws.button.component';
import { SessionService } from '../../services/sessions.service';

interface NoteItem {
  id?: string;
  title: string,
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: 'app-dm-notes',
  imports: [Note, ResultThrowFrameComponent, GeneralThrowsButtonComponent],
  templateUrl: './dm-notes.html',
  styleUrl: './dm-notes.css',
})
export class DmNotes {
  maxNotes: number = 40;
  maxNotesExceeded: boolean = false;
  notes: NoteItem[] = [];
  sessionId: string = '';
  unsubscribe: (() => void) | undefined;
  newNote: NoteItem = {
    title: '',
    content: ''
  };

  constructor(private dmNotesService: DmnotesService, private sessionService: SessionService) {}

  ngOnInit() {
    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;

        this.maxNotesExceeded = this.notes.length > this.maxNotes;
      }
    )

    const id = this.sessionService.getCurrentSessionId();

    if (!id) {
      console.error('No hay sesión activa');
      return;
    }

    this.sessionId = id;
  }

  async addNote() {
    if (!this.newNote.title || !this.newNote.content) {
      return;
    }

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
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

}
