import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true; // Start loading
      this.userService.login(this.loginForm.value).subscribe({
        next: (user) => {
          // Show success message
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Login successful!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          this.router.navigate(['/']); // Navigate to home
        },
        error: (error: Error) => {
          // Stop loading and show error message
          this.isLoading = false;
          console.error('Login failed:', error.message);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: error.message, // Use error message from backend
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        },
        complete: () => {
          // Ensure loading is stopped in the complete block
          this.isLoading = false;
        },
      });
    } else {
      // Mark all controls as touched if form is invalid
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
  
}
