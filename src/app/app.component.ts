import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  showNavbar: boolean = false;
  currentDateTime: string = '';
  userName: string = '';

  constructor(private router: Router) {

    // 🔥 ROUTE CHANGE LISTENER (FINAL FIX)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {

        // ✅ handle login + child routes properly
        this.showNavbar = !event.urlAfterRedirects.includes('/login');

        console.log("Route:", event.urlAfterRedirects);
        console.log("Navbar visible:", this.showNavbar);
      }
    });
  }

  ngOnInit() {

    // ✅ USER NAME SAFE LOAD
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user?.name || '';

    // ⏰ LIVE CLOCK
    setInterval(() => {
      const now = new Date();

      const dayName = now.toLocaleString('en-IN', { weekday: 'long' });
      const day = String(now.getDate()).padStart(2, '0');
      const month = now.toLocaleString('en-IN', { month: 'long' });
      const year = now.getFullYear();

      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const sec = now.getSeconds();
      const seconds = String(sec).padStart(2, '0');

      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = hours % 12 || 12;

      const blink = sec % 2 === 0 ? ':' : ' ';

      this.currentDateTime =
        `${dayName}, ${day} ${month} ${year} ⏰ ${formattedHour}${blink}${minutes}${blink}${seconds} ${ampm}`;

    }, 1000);
  }

  // 🔓 LOGOUT (SAFE)
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}