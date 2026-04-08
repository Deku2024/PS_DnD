import { Component, OnInit, OnDestroy, ɵisSubscribable } from '@angular/core';
import { Note } from '../../components/note/note';
import { DmnotesService } from '../../services/dmnotes.service';

interface NoteItem {
  id?: string;
  title: string,
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: 'app-dm-notes',
  imports: [Note],
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

  constructor(private dmNotesService: DmnotesService) {}

  ngOnInit() {
    this.unsubscribe = this.dmNotesService.listenToNotes(
      this.sessionId,
      (notes) => {
        this.notes = notes;

        this.maxNotesExceeded = this.notes.length > this.maxNotes;
      }
    )
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


  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

}
