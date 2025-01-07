import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-verification-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verification-success.component.html',
  styleUrl: './verification-success.component.scss'
})
export class VerificationSuccessComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
