import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class DmnotesService {
  constructor(private firebase: FirebaseService) {}
}
