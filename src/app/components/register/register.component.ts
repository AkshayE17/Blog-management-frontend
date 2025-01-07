import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  async onSubmit() {
    if (this.registerForm.valid && this.selectedFile) {
      this.isLoading = true;
      try {
        const fileName = this.selectedFile.name;
        const fileType = this.selectedFile.type;

        // Request pre-signed URL
        const presignedUrlResponse = await this.userService.getUploadUrl(fileName, fileType).toPromise();
        const presignedUrl = presignedUrlResponse?.url;

        if (!presignedUrl) {
          console.error('Failed to get presigned URL response');
          return;
        }

        // Upload the file to S3 using the pre-signed URL
        await this.userService.uploadFileToS3(presignedUrl, this.selectedFile);

        const formData = {
          name: this.registerForm.get('name')?.value,
          email: this.registerForm.get('email')?.value,
          password: this.registerForm.get('password')?.value,
          imageUrl: presignedUrl.split('?')[0], // Only the S3 URL
        };
        
        // Submit the registration form
        await this.userService.register(formData).toPromise();
        this.router.navigate([`otp-verify/${formData.email}`]);
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  
     
}
