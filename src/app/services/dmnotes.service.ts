import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class DmnotesService {
  constructor(private firebase: FirebaseService) {}

  private notesRef(sessionId: string) {
    return collection(this.firebase.db, `sessions/${sessionId}/notes`);
  }

  async createNote(sessionId: string, note: any) {
    return await addDoc(this.notesRef(sessionId), {
      ...note,
      createdAt: new Date(),
      updatedAt: new Date()   
    });
  }

  async updateNote(sessionId: string, noteId: string, data: any) {
    const noteDoc = doc(this.firebase.db,  `sessions/${sessionId}/notes/${noteId}`);
    return await updateDoc(noteDoc, {
      ...data,
      updatedAt: new Date()
    });
  }

  async deleteNote(sessionId: string, noteId: string) {
    const noteDoc = doc(this.firebase.db,  `sessions/${sessionId}/notes/${noteId}`);
    return await deleteDoc(noteDoc);
  }

  listenToNotes(sessionId: string, callback: (notes: any[]) => void) {
    const q = query(this.notesRef(sessionId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, snapshot => {
      const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
      }));
      callback(notes);
    });
  }
}
