import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// 1. CAMBIO: Importamos de 'firebase/firestore' en lugar de '@angular/fire'
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Note } from '../../components/note/note';

interface NoteItem {
  id: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-dm-notes',
  standalone: true,
  imports: [Note],
  templateUrl: './dm-notes.html',
  styleUrl: './dm-notes.css',
})
export class DmNotes implements OnInit, OnDestroy {
  maxNotes: number = 40;
  notes: NoteItem[] = [];
  sessionId: string = '';

  private unsubscribe!: () => void;
  // 2. CAMBIO: Obtenemos la base de datos directamente de Firebase
  private db = getFirestore();

  // 3. CAMBIO: Quitamos Firestore del constructor, ya no hace falta inyectarlo
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    if (this.sessionId) {
      const notesRef = collection(this.db, `sessions/${this.sessionId}/notes`);

      // 4. CAMBIO: Añadimos ": any" para quitar el error estricto de TypeScript
      this.unsubscribe = onSnapshot(notesRef, (snapshot: any) => {
        this.notes = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as NoteItem));
      });
    }
  }

  async createNote() {
    if (this.notes.length >= this.maxNotes) {
      alert("Número de notas excedido.");
      return;
    }

    const notesRef = collection(this.db, `sessions/${this.sessionId}/notes`);
    const newNoteRef = doc(notesRef);

    await setDoc(newNoteRef, {
      title: '',
      content: ''
    });

    setTimeout(() => this.scrollToNewNote(), 100);
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private scrollToNewNote() {
    const container = document.querySelector('.notes-area');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
