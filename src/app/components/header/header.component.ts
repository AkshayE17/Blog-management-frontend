import { Component, effect, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { IUser } from '../../state/user/userState';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isDarkMode = signal(false);
  isLoggedIn = false;
  user: IUser = {
    _id: '',
    name: '',
    email: '',
    imageUrl: '',
    password: ''
  };

  constructor(private userService: UserService, private router: Router) {
    effect(() => {
      localStorage.setItem('darkMode', this.isDarkMode().toString());
    });
  }

  ngOnInit() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'true');
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      }
    } else {
      this.isDarkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  
    // Subscribe to user data and login state
    this.userService.currentUser$.subscribe(user => {
      console.log('Header received user data:', user); // Debug statement
      if (user) {
        this.user = user;
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }
  

  toggleTheme() {
    this.isDarkMode.update(current => !current);
    document.documentElement.classList.toggle('dark');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  openProfile() {
    this.router.navigate(['/details']);
  }
}
