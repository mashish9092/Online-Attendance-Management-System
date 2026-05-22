import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  role: string = '';
  userName: string = '';
 currentDateTime: string = ''; 
  private timer: any;

  constructor(private router: Router) {}

 ngOnInit() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  this.userName = user?.name || '';
  this.role = user?.role || '';

  this.updateTime();

  setInterval(() => {
    this.updateTime();
  }, 1000);
}
  // ✅ CLEAN TIMER (important)
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // ✅ CLOCK FUNCTION (PRO FORMAT 🔥)
  updateTime() {
    const now = new Date();

    const day = now.toLocaleString('en-IN', { weekday: 'long' });

    const date = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const time = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

   this.currentDateTime = `📅 ${day}, ${date} ⏰ ${time}`;
  }

  // ✅ LOGOUT (SAFE)
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}