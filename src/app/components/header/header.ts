import {Component, inject, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {UsernameService} from '../../services/username.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  imports: [
    FormsModule
  ],
  styleUrl: './header.css'
})
export class Header {
  usernameService = inject(UsernameService);
  authService = inject(AuthService);

  showAccountModal: WritableSignal<boolean> = signal<boolean>(false);
  showDeleteConfirmModal: WritableSignal<boolean> = signal<boolean>(false);
  showConfirmModal: WritableSignal<boolean> = signal<boolean>(false);

  confirmEmail: string = '';
  confirmPassword: string = '';
  deleteError: string = '';

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

  toggleShowAccountModal(): void {
    this.showAccountModal.set(!this.showAccountModal());
    this.deleteError = '';
  }

  openDeleteConfirm(): void {
    this.showAccountModal.set(false);
    this.showDeleteConfirmModal.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirmModal.set(false);
    this.deleteError = '';
  }

  openEmailConfirm(): void {
    this.showDeleteConfirmModal.set(false);
    this.showConfirmModal.set(true);
    this.confirmEmail = '';
    this.deleteError = '';
  }

  closeEmailConfirm(): void {
    this.showConfirmModal.set(false);
    this.confirmEmail = '';
    this.deleteError = '';
  }

  async confirmDeleteAccount(): Promise<void> {
    if (!await this.authService.isAuthenticated()) {
      return;
    }

    if (!this.confirmEmail) {
      this.deleteError = 'Por favor, introduce tu correo electrónico.';
      return;
    }

    if (this.confirmEmail !== (this.authService.getCurrentUser()?.email || '')) {
      this.deleteError = 'El correo no coincide con el de tu cuenta.';
      return;
    }

    try {
      await this.authService.deleteUserAccount(this.confirmPassword);
      this.closeEmailConfirm();
      this.router.navigate(['/auth']);
    } catch (error: any) {
      this.deleteError = error.message || 'Error al borrar la cuenta. Inténtalo de nuevo.';
    }
  }
}
