import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { IUser } from '../../state/user/userState';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  profileForm: FormGroup;
  user: IUser | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.minLength(6)],
      imageUrl: ['']
    });
  }

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
        });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  async onSubmit() {
    if (this.profileForm.valid && this.user) {
      this.isLoading = true;
      try {
        let imageUrl = this.user.imageUrl; // Default to current imageUrl
  
        // Handle image upload
        if (this.selectedFile) {
          const fileName = 'profile-update.jpg';
          const fileType = 'image/jpeg';
    
          // Get pre-signed URL
          const presignedUrlResponse = await this.userService.getUploadUrl(fileName, fileType).toPromise();
          const presignedUrl = presignedUrlResponse?.url;
          if (!presignedUrl) throw new Error('Failed to get pre-signed URL response');
    
          // Upload file to S3
          await this.userService.uploadFileToS3(presignedUrl, this.selectedFile);
    
          // Extract the image URL from the response
          imageUrl = presignedUrl.split('?')[0];
        }
    
        // Create a new object with only the changed fields
        const updatedFields: Partial<IUser> = {};
    
        // Only update fields that have changed
        if (this.profileForm.get('name')?.value !== this.user.name) {
          updatedFields.name = this.profileForm.get('name')?.value as string;
        }
    
        if (this.selectedFile) {
          updatedFields.imageUrl = imageUrl as string;
        }
    
        // Ensure password is only included if it's updated (not blank)
        const newPassword = this.profileForm.get('password')?.value;
        if (newPassword && newPassword !== this.user.password) {
          updatedFields.password = newPassword;
        }
    
        // Only update the fields that were actually changed
        const updatedUser: IUser = {
          ...this.user,
          ...updatedFields
        };
    
        // Update user in the backend
        await this.userService.updateUser(updatedUser).subscribe({
          next: () => {
            // Update local storage and BehaviorSubject
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.userService.setCurrentUser(updatedUser);
    
            // Manually trigger change detection to update the image in the UI
            this.cdRef.detectChanges();
    
            Swal.fire({
              icon: 'success',
              title: 'Profile updated successfully!',
              timer: 2000,
              showConfirmButton: false,
            });
            this.router.navigate(['/']);
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Update failed!',
              text: error.message || 'Something went wrong!',
            });
          }
        });
      }catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Update failed!',
          text: error.message || 'Something went wrong!',
        });
      }finally {
        this.isLoading = false;
      }
    }
  }   
  

  onImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        this.profileForm.patchValue({ imageUrl });
        this.profileForm.markAsDirty(); // Mark form as dirty to detect changes
      };
      reader.readAsDataURL(file);
    }
  }

  resetForm() {
    if (this.user) {
      this.profileForm.reset({
        name: this.user.name,
        email: this.user.email,
        password: '', // Clear the password field
        imageUrl: this.user.imageUrl,
      });
      this.selectedFile = null;
      this.profileForm.markAsPristine();
    }
  }
}
   