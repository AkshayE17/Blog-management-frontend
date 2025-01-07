import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { UserService } from '../../services/user.service';
import { IBlog } from '../../state/user/userState';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-blog-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blog-modal.component.html',
  styleUrls: ['./blog-modal.component.scss']
})
export class BlogModalComponent implements OnInit {
  @Input() blog: IBlog | null = null;
  @Input() isEdit = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{title: string; content: string; imageUrl: string}>();
  
  blogForm: FormGroup;
  imageUrl: string | null = null;
  selectedFile: File | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private userService: UserService
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      imageUrl: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.isEdit && this.blog) {
      this.blogForm.patchValue({
        title: this.blog.title,
        content: this.blog.content,
        imageUrl: this.blog.imageUrl
      });
      this.imageUrl = this.blog.imageUrl;
    }
  }   

  setLoadingState(isLoading: boolean) {
    this.isLoading = isLoading;
    if (isLoading) {
      this.blogForm.disable();
    } else {
      this.blogForm.enable();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
        this.blogForm.patchValue({
          imageUrl: this.imageUrl
        });
      };
      reader.readAsDataURL(file);
    }
  }
  
  removeImage() {
    this.imageUrl = null;
    this.selectedFile = null;
    this.blogForm.patchValue({
      imageUrl: ''
    });
  }

  closeModal() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
  
  async onSubmit() {
    if (this.blogForm.valid) {
      this.setLoadingState(true);
      try {
        const currentUser = this.userService.currentUser;
  
        if (!currentUser) {
          throw new Error('No current user found');
        }
  
        let permanentS3Url = this.imageUrl;

        // Only upload new image if a file was selected
        if (this.selectedFile) {
          const fileName = this.selectedFile.name;
          const fileType = this.selectedFile.type;
          
          const presignedUrlResponse = await this.userService.getUploadUrl(fileName, fileType).toPromise();
          const presignedUrl = presignedUrlResponse?.url;
    
          if (!presignedUrl) {
            throw new Error('Failed to get presigned URL');
          }
    
          await this.userService.uploadFileToS3(presignedUrl, this.selectedFile);
          permanentS3Url = presignedUrl.split('?')[0];
        }
  
        const blogData = {
          title: this.blogForm.value.title,
          content: this.blogForm.value.content,
          imageUrl: permanentS3Url ?? '',
          author: currentUser.name,
          authorId: currentUser._id
        };   
        
  
        let result;
        if (this.isEdit && this.blog) {
          result = await this.blogService.updateBlog(this.blog._id, blogData).toPromise();
          await Swal.fire({
            title: 'Success!',
            text: 'Blog post updated successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          result = await this.blogService.createBlog(blogData).toPromise();
          await Swal.fire({
            title: 'Success!',
            text: 'Blog post created successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        }
        
        this.save.emit(result);
        this.blogForm.reset();
        this.imageUrl = null;
        this.selectedFile = null;
        this.closeModal();
      } catch (error) {
        console.error('Failed to save blog:', error);
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to save blog post',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        this.setLoadingState(false);
      }
    }
  }
}