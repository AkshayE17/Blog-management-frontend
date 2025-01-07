import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IBlog } from '../../state/user/userState';
import { BlogModalComponent } from '../blog-modal/blog-modal.component';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BlogModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  searchControl = new FormControl('');
  blogs: IBlog[] = [];
  filteredBlogs: IBlog[] = [];
  userBlogs: IBlog[] = [];
  loading = false;
  showModal = false;
  showingUserBlogs = false;
  selectedBlog: IBlog | null = null;
  isEditMode = false;

  constructor(
    private userService: UserService, 
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.loadBlogs();
    this.searchControl.valueChanges.subscribe((query) => {
      const blogsToFilter = this.showingUserBlogs ? this.userBlogs : this.blogs;
      this.filteredBlogs = blogsToFilter.filter((blog) =>
        blog.title.toLowerCase().includes(query?.toLowerCase() || '')
      );
    });
  }

  isLoggedIn(): boolean {
    let isLoggedIn = false;
    this.userService.isLoggedIn$.subscribe((status) => (isLoggedIn = status));
    return isLoggedIn;
  }

  loadBlogs(): void {
    this.loading = true;
    this.blogService.getAllBlogs().subscribe({
      next: (data) => {
        this.blogs = data;
        const currentUserId = this.userService.currentUser?._id;
        this.userBlogs = data.filter(blog => blog.authorId === currentUserId);
        this.filteredBlogs = [...this.blogs];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching blogs:', error);
        this.loading = false;
      }
    });
  }

  toggleView(): void {
    this.showingUserBlogs = !this.showingUserBlogs;
    this.filteredBlogs = this.showingUserBlogs ? [...this.userBlogs] : [...this.blogs];
    this.searchControl.setValue('');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  openCreateModal(): void {
    this.selectedBlog = null;
    this.isEditMode = false;
    this.showModal = true;
  }

  openEditModal(blog: IBlog): void {
    this.selectedBlog = { ...blog };
    this.isEditMode = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBlog = null;
    this.isEditMode = false;
  }

  onSaveBlog(blogData: { title: string; content: string; imageUrl: string }): void {
    if (this.isEditMode && this.selectedBlog) {
      // Update existing blog
      this.blogService.updateBlog(this.selectedBlog._id, blogData).subscribe({
        next: (updatedBlog) => {
          const index = this.blogs.findIndex(b => b._id === updatedBlog._id);
          if (index !== -1) {
            this.blogs[index] = updatedBlog;
            const userIndex = this.userBlogs.findIndex(b => b._id === updatedBlog._id);
            if (userIndex !== -1) {
              this.userBlogs[userIndex] = updatedBlog;
            }
            this.filteredBlogs = this.showingUserBlogs ? [...this.userBlogs] : [...this.blogs];
          }
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating blog:', error);
        }
      });
    } else {
      // Create new blog
      const newBlog: IBlog = {
        _id: (this.blogs.length + 1).toString(),
        author: this.userService.currentUser?.name || '',
        authorId: this.userService.currentUser?._id || '',
        title: blogData.title,
        content: blogData.content,
        imageUrl: blogData.imageUrl,
        createdAt: new Date(),
        likes: 0,
        bookmarks: [],
        comments: []
      };

      this.blogService.createBlog(newBlog).subscribe({
        next: (savedBlog) => {
          this.blogs.unshift(savedBlog);
          this.userBlogs.unshift(savedBlog);
          this.filteredBlogs = this.showingUserBlogs ? [...this.userBlogs] : [...this.blogs];
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating blog:', error);
        }
      });
    }
  }

  onDeleteBlog(blog: IBlog): void {
    if (confirm('Are you sure you want to delete this blog?')) {
      this.blogService.deleteBlog(blog._id).subscribe({
        next: () => {
          this.blogs = this.blogs.filter(b => b._id !== blog._id);
          this.userBlogs = this.userBlogs.filter(b => b._id !== blog._id);
          this.filteredBlogs = this.showingUserBlogs ? [...this.userBlogs] : [...this.blogs];
        },
        error: (error) => {
          console.error('Error deleting blog:', error);
        }
      });
    }
  }
}