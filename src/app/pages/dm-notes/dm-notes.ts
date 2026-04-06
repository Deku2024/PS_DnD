import { Component } from '@angular/core';
import { Note } from '../../components/note/note';
import { disabled } from '@angular/forms/signals';

interface NoteItem {
  id: number;
  title: string,
  content: string;
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
  private nextId = 1;

  createNote() {
    const newNote: NoteItem = {
      id: this.nextId++,
      title: '',
      content: ''
    };

    this.notes = [...this.notes, newNote];

    if (this.notes.length > this.maxNotes) {
        this.maxNotesExceeded = true;
        const button = document.querySelector('.add-btn');
        button?.setAttribute('disabled', 'disabled');
    } else {
      this.maxNotesExceeded = false;
    }

    setTimeout(() => this.scrollToNewNote(), 100);
  }

  deleteNote(noteId: number) {
    this.notes = this.notes.filter(note => note.id !== noteId);
  }

  private scrollToNewNote() {
    const container = document.querySelector('.notes-area');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

}
