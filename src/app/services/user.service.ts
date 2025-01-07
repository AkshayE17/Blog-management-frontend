
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { IUser, OtpResponse } from '../state/user/userState';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
currentUser$ = this.currentUserSubject.asObservable();

  private baseUrl = 'http://localhost:4444';

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
  
    if (user && token) {
      this.currentUserSubject.next(JSON.parse(user));
      this.loggedIn.next(true);
    } else {
      this.currentUserSubject.next(null);
      this.loggedIn.next(false);
    }
  }
  

  login(credentials: { email: string; password: string }): Observable<IUser> {
    return this.http.post<{ user: IUser; token: string }>(`${this.baseUrl}/user/login`, credentials).pipe(
      tap((response: { user: IUser; token: string }) => {
        // Save user data and token to localStorage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
  
        // Update BehaviorSubjects
        this.currentUserSubject.next(response.user);
        this.loggedIn.next(true);
      }),
      map((response: { user: IUser; token: string }) => response.user), // Transform to IUser
      catchError((error) => {
        console.error('Login error:', error);
        const errorMessage = error.error?.message || 'An unexpected error occurred.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
     
  

  updateUser(user: IUser): Observable<IUser> {
    return this.http.put<IUser>(`${this.baseUrl}/user/${user._id}`, user).pipe(
      tap((updatedUser) => {
        // Update current user in BehaviorSubject
        this.currentUserSubject.next(updatedUser);
      }),
      catchError((error) => {
        console.error('Error updating user:', error);
        return throwError(() => new Error('Update failed'));
      })
    );
  }
  

  setCurrentUser(user: IUser) {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  

  
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.loggedIn.next(false);
  }
  

  register(userData:IUser): Observable<IUser> {
    console.log("User Data",userData);
    return this.http.post<IUser>(`${this.baseUrl}/user/register`, userData);
  }   

  getUploadUrl(fileName: string, fileType: string): Observable<{ url: string }> {
    console.log('Getting upload URL for:', { fileName, fileType });
    return this.http.post<{ url: string }>(
      `${this.baseUrl}/user/generateUrl`, 
      { fileName, fileType }
    ).pipe(
      tap(response => console.log('Got presigned URL:', response)),
      catchError(error => {
        console.error('Error getting upload URL:', {
          status: error.status,
          message: error.message,
          error: error
        });
        throw error;
      })
    );
  }

  uploadFileToS3(url: string, file: File): Promise<void> {
    console.log('Uploading file with:', {
      url,
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    });
  
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })
    .then(async response => {
      if (!response.ok) {
        // Log more error details
        const errorText = await response.text();
        const headersMap = new Map();
        response.headers.forEach((value, name) => {
          headersMap.set(name, value);
        });
        console.error('Upload failed with:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText,
          headers: Object.fromEntries(headersMap)
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      return;
    })
    .catch(error => {
      console.error('Error during file upload:', error);
      throw error;
    });
  }


  verifyOtp(otp: string, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/verifyOtp`, { otp, email }).pipe(
      catchError(error => {
        const errorMessage = error?.error?.message || 'Something went wrong. Please try again.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  get currentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  

  resendOtp(): Observable<any> {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail'); // Assuming you store email

    return this.http.post<OtpResponse>(`${this.baseUrl}/user/resend-otp`, {
      userId,
      email
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        } else {
          throw new Error(response.message || 'Failed to resend OTP');
        }
      }),
      catchError(error => {
        // Handle specific error cases
        if (error.status === 429) {
          return throwError(() => new Error('Too many attempts. Please try again later.'));
        }
        return throwError(() => new Error('Failed to resend OTP. Please try again.'));
      })
    );
  }
}
