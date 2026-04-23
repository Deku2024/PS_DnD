import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  constructor(private auth: AuthService, private router: Router) {}

  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      this.router.navigate(['/auth']);
    }
  }
}
