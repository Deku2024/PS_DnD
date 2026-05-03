import {inject, Injectable} from '@angular/core';
import {FirebaseService} from './firebase.service';
import {collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where} from 'firebase/firestore';

export interface Relation {
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsernameService {
  private readonly collectionName = 'usernameWithEmail';
  firebase = inject(FirebaseService);

  async addRelation(email: string, username: string) {
    await setDoc(doc(this.firebase.db, this.collectionName, username), this.createRelation(email, username) as any);
  }

  private getReference() {
    return collection(this.firebase.db, this.collectionName);
  }

  createRelation(email: string, username: string) : Relation {
    return {
      email: email,
      username: username
    };
  }

  async getEmailFromUsername(username: string): Promise<string> {
    let snap = await getDoc(doc(this.getReference(), username));
    if (!snap.exists()) {
      return '';
    }
    return (snap.data() as Relation).email;
  }

  async getUsernameFromEmail(email: string): Promise<string | null> {
    const querySnapshot = await getDocs(query(this.getReference(), where('email', '==', email)));
    if (querySnapshot.empty || querySnapshot.size > 1) return null;
    return (querySnapshot.docs[0].data() as Relation).username;
  }

  async existsUsername(username: string) {
    return (await getDoc(doc(this.firebase.db, this.collectionName, username))).exists();
  }

  getCurrentUsername(): string {
    return this.firebase.auth.currentUser?.displayName || "";
  }

  async removeCurrentUsername(username: string) {
    await deleteDoc(doc(this.firebase.db, this.collectionName, username));
  }
}
