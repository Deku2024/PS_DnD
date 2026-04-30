import {inject, Injectable} from '@angular/core';
import {FirebaseService} from './firebase.service';
import {collection, doc, getDoc, getDocs, query, setDoc, where} from 'firebase/firestore';

export interface Relation {
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsernameService {
  private readonly collectionName = 'usernameWithEmail';
  private readonly redundantCollection = 'usernames'; // se hace esta colección para tener solo los nombres de usuario que se puedan leer desde fuera y proteger los correos
  firebase = inject(FirebaseService);

  async addRelation(email: string, username: string) {
    await setDoc(doc(this.firebase.db, this.collectionName, username), this.createRelation(email, username) as any);
    await setDoc(doc(this.firebase.db, this.redundantCollection, username), {username} as any);
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

  async getEmailFromUsername(username: string): Promise<string | null> {
    let snap = await getDoc(doc(this.getReference(), username));
    if (!snap.exists()) {
      return null;
    }
    return (snap.data() as Relation).email;
  }

  async getUsernameFromEmail(email: string): Promise<string | null> {
    const querySnapshot = await getDocs(query(this.getReference(), where('email', '==', email)));
    if (querySnapshot.empty || querySnapshot.size > 1) return null;
    return (querySnapshot.docs[0].data() as Relation).username;
  }

  async existsUsername(username: string) {
    return (await getDoc(doc(this.firebase.db, this.redundantCollection, username))).exists();
  }

}
