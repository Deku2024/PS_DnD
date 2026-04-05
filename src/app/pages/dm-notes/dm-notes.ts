import { Component } from '@angular/core';
import { Note } from '../../components/note/note';

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
        alert("Número de notas excedido.");
    }

    setTimeout(() => this.scrollToNewNote(), 100);
  }

  private scrollToNewNote() {
    const container = document.querySelector('.notes-area');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

}
