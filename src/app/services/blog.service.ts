import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBlog } from '../state/user/userState';  // Assuming IBlog is defined properly

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private baseUrl = 'https://blog-management-backend-iyk6.onrender.com/blogs';  // Adjust the base URL as needed

  constructor(private http: HttpClient) { }

  // Get all blogs
  getAllBlogs(): Observable<IBlog[]> {
    return this.http.get<IBlog[]>(`${this.baseUrl}`);
  }

  // Get blog by ID
  getBlogById(id: string): Observable<IBlog> {
    return this.http.get<IBlog>(`${this.baseUrl}/${id}`);
  }

  // Create a new blog
  createBlog(blogData: { title: string, content: string, imageUrl: string }): Observable<IBlog> {
    return this.http.post<IBlog>(`${this.baseUrl}`, blogData);
  }

  // Update a blog by ID
  updateBlog(id: string, blogData: { title: string, content: string, imageUrl: string }): Observable<IBlog> {
    return this.http.put<IBlog>(`${this.baseUrl}/${id}`, blogData);
  }

  // Delete a blog by ID
  deleteBlog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Add comment to a blog
  addCommentToBlog(blogId: string, comment: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${blogId}/comments`, { comment });
  }

  // Like a blog
  likeBlog(blogId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${blogId}/like`, {});
  }

  // Bookmark a blog
  bookmarkBlog(blogId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${blogId}/bookmark`, {});
  }
}
