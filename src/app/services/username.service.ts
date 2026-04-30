import {inject, Injectable} from '@angular/core';
import {FirebaseService} from './firebase.service';
import {addDoc, collection, doc, getDoc, getDocs, query, where} from 'firebase/firestore';

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
    await addDoc(this.getReference(), this.createRelation(email, username) as any);
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
    let snap = await getDoc(doc(this.getReference(), this.collectionName, username));
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

}
