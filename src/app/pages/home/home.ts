import {Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {D20RollerButtonComponent} from '../../components/d20.roller.button.component/d20.roller.button.component';
import {ResultThrowFrameComponent} from '../../components/result.throw.frame.component/result.throw.frame.component';
import {
  SingleCustomThrowButtonComponent
} from '../../components/single.custom.throw.button.component/single.custom.throw.button.component';
import {
  GeneralThrowsButtonComponent
} from '../../components/general.throws.button.component/general.throws.button.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  loading = false;
  constructor(private auth: AuthService, private router: Router) { }

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
