import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { UserService } from '../../services/user.service';
import { IBlog } from '../../state/user/userState';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss'
})
export class BlogDetailComponent implements OnInit {
  blog: IBlog | null = null;
  loading = false;
  commentControl = new FormControl('');
  hasLiked = false;
  hasBookmarked = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const blogId = this.route.snapshot.paramMap.get('id');
    if (blogId) {
      this.blogService.getBlogById(blogId).subscribe({
        next: (blog) => {
          this.blog = blog;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching blog:', error);
          this.loading = false;
        }
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  isLoggedIn(): boolean {
    let isLoggedIn = false;
    this.userService.isLoggedIn$.subscribe((status) => (isLoggedIn = status));
    return isLoggedIn;
  }

  onLike(): void {
    if (this.blog && this.isLoggedIn()) {
      this.blogService.likeBlog(this.blog._id).subscribe({
        next: () => {
          if (this.blog) {
            this.blog.likes += 1;
            this.hasLiked = true;
          }
        },
        error: (error) => console.error('Error liking blog:', error)
      });
    }
  }

  onBookmark(): void {
    if (this.blog && this.isLoggedIn()) {
      this.blogService.bookmarkBlog(this.blog._id).subscribe({
        next: () => {
          this.hasBookmarked = true;
        },
        error: (error) => console.error('Error bookmarking blog:', error)
      });
    }
  }

  onComment(): void {
    if (this.blog && this.isLoggedIn() && this.commentControl.value) {
      this.blogService.addCommentToBlog(this.blog._id, this.commentControl.value).subscribe({
        next: (updatedBlog: IBlog) => {
          this.blog = updatedBlog;
          this.commentControl.reset();
        },
        error: (error) => console.error('Error posting comment:', error)
      });
    }
  }
}