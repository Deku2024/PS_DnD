import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getDatabase, Database } from 'firebase/database';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;
  public storage: FirebaseStorage;
  public rtdb: Database;
  public analytics?: Analytics;

  constructor() {
    this.app = this.initApp();
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.rtdb = getDatabase(this.app);
    if (this.isBrowser()) {
      try {
        this.analytics = getAnalytics(this.app);
      } catch (e) {
        // Analytics may fail in some environments (SSR, blocked cookies, etc.).
      }
    }
  }

  private initApp(): FirebaseApp {
    if (!getApps().length) {
      return initializeApp(environment.firebase);
    }
    return getApp();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
