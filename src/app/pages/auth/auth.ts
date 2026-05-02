import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgZone, ChangeDetectorRef } from '@angular/core';
import {UsernameService} from '../../services/username.service';

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
  username = '';
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;
  showPassword = false;
  private messageTimer: any = null;
  identification: string = '';

  constructor(
    private authService: AuthService,
    private usernameService: UsernameService,
    private router: Router,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  toggle() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.success = '';
    // remove focus from the clicked button so it doesn't stay visually active
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active && typeof active.blur === 'function') active.blur();
      }, 0);
    }
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

  get passwordLengthOk(): boolean {
    return this.password?.length >= 8;
  }

  get passwordHasUpper(): boolean {
    return /[A-Z]/.test(this.password || '');
  }

  get passwordHasLower(): boolean {
    return /[a-z]/.test(this.password || '');
  }

  get passwordHasNumber(): boolean {
    return /\d/.test(this.password || '');
  }

  get passwordHasSpecial(): boolean {
    return /[\W_]/.test(this.password || '');
  }

  get passwordMeetsRequirements(): boolean {
    return this.passwordLengthOk && this.passwordHasUpper && this.passwordHasLower && this.passwordHasNumber && this.passwordHasSpecial;
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
        await this.authService.signIn(this.identification, this.password);
            // navigate to home on successful login
            await this.router.navigate(['/home']);
        this.ngZone.run(() => {
          this.success = 'Logged in successfully.';
          this.cd.detectChanges();
          this.autoClearMessage(2000);
        });
      } else {
        // sign up
        // validate password requirements before attempting sign up
        if (!this.passwordMeetsRequirements) {
          this.ngZone.run(() => {
            this.error = 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y carácter especial.';
            this.loading = false;
            this.cd.detectChanges();
            this.autoClearMessage(4000);
          });
          return;
        }

        if (this.password !== this.confirmPassword) {
          this.ngZone.run(() => {
            this.error = 'Las contraseñas no coinciden.';
            this.loading = false;
            this.cd.detectChanges();
            this.autoClearMessage(3000);
          });
          return;
        }

        if (await this.usernameService.existsUsername(this.username)) {
          this.ngZone.run(() => {
            this.error = 'Este nombre de usuario ya existe';
            this.loading = false;
            this.cd.detectChanges();
            this.autoClearMessage(3000);
          });
          return;
        }

        // use a timeout wrapper to avoid hanging if network/firebase stalls
        let userCredential: any = null;
        try {
          userCredential = await this.withTimeout(this.authService.signUp(this.email, this.password, this.username), 12000);
          await this.router.navigate(['/home']);
        } catch (e: any) {
          if (e?.message === 'timeout') {
            this.ngZone.run(() => {
              this.error = 'Tiempo de espera agotado. Revisa tu conexión e inténtalo de nuevo.';
              this.loading = false;
              this.cd.detectChanges();
              this.autoClearMessage(4000);
            });
            return;
          }
          // rethrow to be handled by outer catch
          throw e;
        }

        // send verification email if possible
        try {
          await this.withTimeout(this.authService.sendEmailVerification(), 8000);
          this.ngZone.run(() => {
            this.success = 'Cuenta creada correctamente. Se ha enviado un correo de verificación.';
            this.email = '';
            this.password = '';
            this.confirmPassword = '';
            this.isLogin = true;
            this.cd.detectChanges();
            this.autoClearMessage(3500);
          });
        } catch (e: any) {
          // if verification fails, still consider signup complete but inform the user
          this.ngZone.run(() => {
            this.success = 'Cuenta creada. No se pudo enviar el correo de verificación automáticamente; comprueba tu correo.';
            this.email = '';
            this.password = '';
            this.confirmPassword = '';
            this.isLogin = true;
            this.cd.detectChanges();
            this.autoClearMessage(5000);
          });
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Authentication error';
      // Map firebase error to friendly message and surface it to UI
      const friendly = this.authService.friendlyErrorMessage(err);
      this.ngZone.run(() => {
        this.error = friendly;
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

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms);
      p.then(v => {
        clearTimeout(timer);
        resolve(v);
      }).catch(err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async resetPassword() {
    if (!this.email) {
      this.ngZone.run(() => {
        this.error = 'Introduce tu correo para recibir el enlace de recuperación.';
        this.cd.detectChanges();
        this.autoClearMessage(3500);
      });
      return;
    }

    // remove focus from invoking control so it doesn't stay marked
    if (typeof document !== 'undefined') {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === 'function') active.blur();
    }

    this.ngZone.run(() => {
      this.loading = true;
      this.error = '';
      this.success = '';
      this.cd.detectChanges();
    });

    try {
      await this.withTimeout(this.authService.sendPasswordReset(this.email), 10000);
      this.ngZone.run(() => {
        this.success = 'Se ha enviado un correo para restablecer la contraseña. Revisa tu bandeja.';
        this.cd.detectChanges();
        this.autoClearMessage(4000);
      });
    } catch (err: any) {
      const friendly = this.authService.friendlyErrorMessage(err);
      this.ngZone.run(() => {
        this.error = friendly;
        this.cd.detectChanges();
        this.autoClearMessage(4000);
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cd.detectChanges();
      });
    }
  }

}
