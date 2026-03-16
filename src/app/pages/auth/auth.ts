import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

@Component({
  standalone: true,
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth {
  isLogin = true;
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;
  showPassword = false;

  constructor(private firebase: FirebaseService) {}

  toggle() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.success = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    this.error = '';
    this.success = '';
    this.loading = true;
    try {
      if (this.isLogin) {
        await signInWithEmailAndPassword(this.firebase.auth, this.email, this.password);
        this.success = 'Logged in successfully.';
      } else {
        if (this.password !== this.confirmPassword) {
          this.error = 'Passwords do not match.';
          this.loading = false;
          return;
        }
        await createUserWithEmailAndPassword(this.firebase.auth, this.email, this.password);
        this.success = 'Account created successfully. You are logged in.';
      }
      this.email = '';
      this.password = '';
      this.confirmPassword = '';
    } catch (e: any) {
      this.error = e?.message || 'Authentication error';
    } finally {
      this.loading = false;
    }
  }

}
