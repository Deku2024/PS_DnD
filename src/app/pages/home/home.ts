import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  loading = false;
  constructor(private auth: AuthService, private router: Router) {}

  async signOut() {
    this.loading = true;
    try {
      await this.auth.signOut();
      await this.router.navigate(['/auth']);
    } catch (e) {
      // ignore for now, could show toast
      console.error('Sign out error', e);
    } finally {
      this.loading = false;
    }
  }
}
