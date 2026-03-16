import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgZone, ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth implements OnDestroy {
  isLogin = true;
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;
  showPassword = false;
  private messageTimer: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  toggle() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.success = '';
  }

  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    // normalize UI updates through NgZone
    this.ngZone.run(() => {
      this.error = '';
      this.success = '';
      this.loading = true;
      this.cd.detectChanges();
    });

    try {
      if (this.isLogin) {
        await this.authService.signIn(this.email, this.password);
            // navigate to home on successful login
            await this.router.navigate(['/home']);
        this.ngZone.run(() => {
          this.success = 'Logged in successfully.';
          this.cd.detectChanges();
          this.autoClearMessage(2000);
        });
      } else {
        // sign up
        if (this.password !== this.confirmPassword) {
          this.ngZone.run(() => {
            this.error = 'Passwords do not match.';
            this.loading = false;
            this.cd.detectChanges();
            this.autoClearMessage(3000);
          });
          return;
        }

        await this.authService.signUp(this.email, this.password);

        // on success: clear inputs, switch to login view and show modal
        this.ngZone.run(() => {
          this.success = 'Account created successfully. Please login.';
          this.email = '';
          this.password = '';
          this.confirmPassword = '';
          this.isLogin = true; // switch to login view immediately
          this.cd.detectChanges();
          this.autoClearMessage(2500);
        });
      }
    } catch (err: any) {
      const message = err?.message || 'Authentication error';
      // surface error to UI
      this.ngZone.run(() => {
        this.error = message;
        this.cd.detectChanges();
        this.autoClearMessage(4000);
      });
    } finally {
      // always ensure loading flag is cleared inside the zone
      this.ngZone.run(() => {
        this.loading = false;
        this.cd.detectChanges();
      });
    }
  }

  private autoClearMessage(ms: number) {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    this.messageTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.error = '';
        this.success = '';
        this.cd.detectChanges();
        this.messageTimer = null;
      });
    }, ms);
  }

}
